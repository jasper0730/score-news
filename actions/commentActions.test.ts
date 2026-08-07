import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import {
    makeCommentDoc,
    makeUser,
    makeUserDoc,
    OTHER_USER_ID,
    USER_ID,
} from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const requireAuth = vi.hoisted(() => vi.fn())
const requireAuthWithRole = vi.hoisted(() => vi.fn())
vi.mock('@/libs/auth', () => ({ requireAuth, requireAuthWithRole }))

const {
    getCommentsByPostId,
    getCommentsByUserId,
    createCommentAction,
    deleteCommentAction,
    getRatingSummary,
} = await import('@/actions/commentActions')

beforeEach(() => {
    requireAuth.mockResolvedValue({ authenticated: true, user: makeUser() })
    requireAuthWithRole.mockResolvedValue({
        authenticated: true,
        user: makeUser(),
        isAdmin: false,
    })
})

describe('getCommentsByPostId', () => {
    it('依文章取留言，新的排前面', async () => {
        const doc = makeCommentDoc()
        collection('comments').cursor.toArray.mockResolvedValue([doc])

        const result = await getCommentsByPostId('news-1')

        expect(collection('comments').find).toHaveBeenCalledWith(
            expect.objectContaining({ postId: 'news-1' })
        )
        expect(collection('comments').cursor.sort).toHaveBeenCalledWith({ createdAt: -1 })
        expect(result.success).toBe(true)
        expect(result.comments[0]?._id).toBe(doc._id.toString())
    })

    it('_id 會轉成字串，才能安全跨越 server/client 邊界', async () => {
        collection('comments').cursor.toArray.mockResolvedValue([makeCommentDoc()])

        const result = await getCommentsByPostId('news-1')

        expect(typeof result.comments[0]?._id).toBe('string')
        expect(result.comments[0]?._id).not.toBeInstanceOf(ObjectId)
    })

    it('查詢失敗時回傳空留言與錯誤訊息', async () => {
        collection('comments').cursor.toArray.mockRejectedValue(new Error('boom'))

        expect(await getCommentsByPostId('news-1')).toEqual({
            success: false,
            comments: [],
            error: 'Internal server error',
        })
    })

    describe('顯示名稱脫敏', () => {
        it('退回 email 的顯示名稱會遮蔽，完整信箱不進 payload', async () => {
            collection('comments').cursor.toArray.mockResolvedValue([
                makeCommentDoc({ userName: 'wilson0730@gmail.com' }),
            ])

            const result = await getCommentsByPostId('news-1')

            expect(result.comments[0]?.userName).toBe('w***0@gmail.com')
            expect(JSON.stringify(result)).not.toContain('wilson0730@gmail.com')
        })

        it('暱稱與 name 不是 email，原樣顯示', async () => {
            collection('comments').cursor.toArray.mockResolvedValue([
                makeCommentDoc({ userName: '阿明' }),
            ])

            const result = await getCommentsByPostId('news-1')

            expect(result.comments[0]?.userName).toBe('阿明')
        })

        it('後台「我的評論」也一併脫敏', async () => {
            collection('comments').cursor.toArray.mockResolvedValue([
                makeCommentDoc({ userName: 'wilson0730@gmail.com' }),
            ])

            const result = await getCommentsByUserId(USER_ID)

            expect(result.comments[0]?.userName).toBe('w***0@gmail.com')
        })
    })

    describe('軟刪除後的可見性', () => {
        it('查詢條件排除本人自刪、保留管理員下架的', async () => {
            await getCommentsByPostId('news-1')

            const filter = collection('comments').find.mock.calls[0]?.[0]
            expect(filter).toEqual({
                postId: 'news-1',
                $or: [{ deletedAt: { $exists: false } }, { deletedByAdmin: true }],
            })
        })

        it('管理員下架的評論只回傳墓碑，原始內容不外洩', async () => {
            // 下架的意思是誰都不該再看到，不是「畫面不顯示但原始碼讀得到」
            collection('comments').cursor.toArray.mockResolvedValue([
                makeCommentDoc({
                    content: '違規內容',
                    rating: 5,
                    deletedAt: '2026-08-07T00:00:00.000Z',
                    deletedByAdmin: true,
                }),
            ])

            const result = await getCommentsByPostId('news-1')

            expect(result.comments[0]).toMatchObject({ isRemovedByAdmin: true, content: '' })
            expect(result.comments[0]?.rating).toBeUndefined()
            expect(JSON.stringify(result)).not.toContain('違規內容')
        })

        it('正常評論不帶下架標記', async () => {
            collection('comments').cursor.toArray.mockResolvedValue([makeCommentDoc()])

            const result = await getCommentsByPostId('news-1')

            expect(result.comments[0]?.isRemovedByAdmin).toBeUndefined()
            expect(result.comments[0]?.content).toBe('很棒的報導')
        })

        it('後台「我的評論」套用同一套可見性規則', async () => {
            await getCommentsByUserId(USER_ID)

            const filter = collection('comments').find.mock.calls[0]?.[0]
            expect(filter).toMatchObject({
                userId: USER_ID,
                $or: [{ deletedAt: { $exists: false } }, { deletedByAdmin: true }],
            })
        })
    })
})

describe('getCommentsByUserId', () => {
    it('依使用者取留言，新的排前面', async () => {
        collection('comments').cursor.toArray.mockResolvedValue([makeCommentDoc()])

        const result = await getCommentsByUserId(USER_ID)

        expect(collection('comments').find).toHaveBeenCalledWith(
            expect.objectContaining({ userId: USER_ID })
        )
        expect(collection('comments').cursor.sort).toHaveBeenCalledWith({ createdAt: -1 })
        expect(result.comments).toHaveLength(1)
    })

    it('查詢失敗時回傳空留言與錯誤訊息', async () => {
        collection('comments').cursor.toArray.mockRejectedValue(new Error('boom'))

        expect(await getCommentsByUserId(USER_ID)).toEqual({
            success: false,
            comments: [],
            error: 'Internal server error',
        })
    })
})

describe('getRatingSummary', () => {
    it('平均只算沒有被刪除、且有給分的評論', async () => {
        // 評分只存在於評論裡，這是唯一來源
        await getRatingSummary('news-1', 'user-1')

        const pipeline = collection('comments').aggregate.mock.calls[0]?.[0] as Record<
            string,
            unknown
        >[]
        expect(pipeline[0]).toEqual({
            $match: { postId: 'news-1', deletedAt: { $exists: false }, rating: { $gt: 0 } },
        })
    })

    it('管理員下架的評論也不計入——因違規而隱藏的內容其評分不該還算數', async () => {
        await getRatingSummary('news-1', 'user-1')

        const pipeline = collection('comments').aggregate.mock.calls[0]?.[0] as {
            $match: Record<string, unknown>
        }[]
        // 只用 deletedAt 判斷，不區分是誰刪的，兩種刪除都排除
        expect(pipeline[0]?.$match).not.toHaveProperty('deletedByAdmin')
    })

    it('回傳計算出的平均與使用者自己的分數', async () => {
        collection('comments').aggregateCursor.toArray.mockResolvedValue([{ _id: null, avg: 3.5 }])
        collection('comments').findOne.mockResolvedValue(makeCommentDoc({ rating: 5 }))

        expect(await getRatingSummary('news-1', 'user-1')).toEqual({
            averageRating: 3.5,
            userRating: 5,
        })
    })

    it('一則評論都沒有時兩個值都回 0，而不是 null 或 NaN', async () => {
        collection('comments').aggregateCursor.toArray.mockResolvedValue([])
        collection('comments').findOne.mockResolvedValue(null)

        expect(await getRatingSummary('news-1', 'user-1')).toEqual({
            averageRating: 0,
            userRating: 0,
        })
    })

    it('自己的評論已刪除時 userRating 回 0——表單不該還亮著已經不存在的星等', async () => {
        collection('comments').findOne.mockResolvedValue(null)

        await getRatingSummary('news-1', 'user-1')

        expect(collection('comments').findOne).toHaveBeenCalledWith({
            postId: 'news-1',
            userId: 'user-1',
            deletedAt: { $exists: false },
        })
    })
})

describe('createCommentAction', () => {
    beforeEach(() => {
        collection('users').findOne.mockResolvedValue(makeUserDoc())
        collection('comments').findOneAndUpdate.mockResolvedValue(makeCommentDoc())
    })

    it('未登入時拒絕', async () => {
        requireAuth.mockResolvedValue({ authenticated: false, error: 'User not authenticated' })

        const result = await createCommentAction('news-1', '標題', '內容', 5)

        expect(result).toEqual({ success: false, error: 'User not authenticated' })
        expect(collection('comments').findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('沒有 postId 時拒絕', async () => {
        const result = await createCommentAction('', '標題', '內容', 5)

        expect(result.success).toBe(false)
    })

    it('內容與評分都沒有時拒絕', async () => {
        const result = await createCommentAction('news-1', '標題', '   ')

        expect(result).toEqual({
            success: false,
            error: 'postId and content or rating are required',
        })
    })

    it('只給評分、不寫內容是允許的', async () => {
        const result = await createCommentAction('news-1', '標題', '', 5)

        expect(result.success).toBe(true)
    })

    it('同一使用者對同一篇文章只會有一則留言（upsert）', async () => {
        await createCommentAction('news-1', '標題', '內容', 5)

        const [filter, , options] = collection('comments').findOneAndUpdate.mock.calls[0] ?? []
        expect(filter).toEqual({ userId: USER_ID, postId: 'news-1' })
        expect(options).toEqual({ upsert: true, returnDocument: 'after' })
    })

    it('顯示名稱優先用暱稱', async () => {
        collection('users').findOne.mockResolvedValue(makeUserDoc({ nickname: '阿明' }))

        await createCommentAction('news-1', '標題', '內容', 5)

        const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
        expect(update.$set.userName).toBe('阿明')
    })

    it.each([
        [{ nickname: undefined }, { name: '小明', email: 'ming@example.com' }, '小明'],
        [
            { nickname: undefined },
            { name: undefined, email: 'ming@example.com' },
            'ming@example.com',
        ],
        [{ nickname: undefined }, { name: undefined, email: undefined }, '匿名用戶'],
    ])(
        '沒有暱稱時依序退回 name / email / 匿名用戶',
        async (docOverride, userOverride, expected) => {
            collection('users').findOne.mockResolvedValue(makeUserDoc(docOverride))
            requireAuth.mockResolvedValue({
                authenticated: true,
                user: makeUser(userOverride as never),
            })

            await createCommentAction('news-1', '標題', '內容', 5)

            const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
            expect(update.$set.userName).toBe(expected)
        }
    )

    it('內容會去除前後空白', async () => {
        await createCommentAction('news-1', '標題', '  有內容  ', 5)

        const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
        expect(update.$set.content).toBe('有內容')
    })

    it('沒有帶 rating 時不覆寫既有的評分', async () => {
        await createCommentAction('news-1', '標題', '只改內容')

        const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
        expect(update.$set).not.toHaveProperty('rating')
    })

    describe('編輯歷史', () => {
        it('第一次留言不寫歷史，也不標記已編輯', async () => {
            collection('comments').findOne.mockResolvedValue(null)

            await createCommentAction('news-1', '標題', '內容', 5)

            expect(collection('comment_edits_history').insertOne).not.toHaveBeenCalled()
            const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
            expect(update.$set).not.toHaveProperty('editedAt')
        })

        it('修改時把舊內容寫進歷史表，主表只留最新版', async () => {
            const existing = makeCommentDoc({ content: '舊內容', rating: 3 })
            collection('comments').findOne.mockResolvedValue(existing)

            await createCommentAction('news-1', '標題', '新內容', 5)

            const history = collection('comment_edits_history').insertOne.mock.calls[0]?.[0]
            expect(history).toMatchObject({
                commentId: existing._id,
                content: '舊內容',
                rating: 3,
            })
            expect(history.replacedAt).toBeTruthy()
        })

        it('修改後主表標記 editedAt，畫面才知道要顯示「已編輯」', async () => {
            collection('comments').findOne.mockResolvedValue(makeCommentDoc({ content: '舊內容' }))

            await createCommentAction('news-1', '標題', '新內容', 4)

            const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
            expect(update.$set.editedAt).toBeTruthy()
        })

        it('內容與評分都沒變時不算編輯——重送一次不該留下歷史', async () => {
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ content: '一樣的內容', rating: 4 })
            )

            await createCommentAction('news-1', '標題', '一樣的內容', 4)

            expect(collection('comment_edits_history').insertOne).not.toHaveBeenCalled()
            const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
            expect(update.$set).not.toHaveProperty('editedAt')
        })

        it('只改評分也算編輯', async () => {
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ content: '內容', rating: 3 })
            )

            await createCommentAction('news-1', '標題', '內容', 5)

            expect(collection('comment_edits_history').insertOne).toHaveBeenCalledOnce()
        })
    })

    describe('被下架後重新發表', () => {
        it('管理員下架的評論不能靠再送一次蓋掉', async () => {
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ deletedAt: '2026-08-07T00:00:00.000Z', deletedByAdmin: true })
            )

            const result = await createCommentAction('news-1', '標題', '想要規避', 5)

            expect(result).toEqual({
                success: false,
                error: '這則評論已被管理員下架，無法重新發表',
            })
            expect(collection('comments').findOneAndUpdate).not.toHaveBeenCalled()
        })

        it('本人自刪的可以重新發表，並清掉刪除標記', async () => {
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ deletedAt: '2026-08-07T00:00:00.000Z', deletedByAdmin: false })
            )

            await createCommentAction('news-1', '標題', '重新發表', 5)

            const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
            expect(update.$unset).toEqual({ deletedAt: '', deletedBy: '', deletedByAdmin: '' })
        })

        it('重新發表不算編輯，不會標記已編輯', async () => {
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ deletedAt: '2026-08-07T00:00:00.000Z', deletedByAdmin: false })
            )

            await createCommentAction('news-1', '標題', '重新發表', 5)

            const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
            expect(update.$set).not.toHaveProperty('editedAt')
            expect(collection('comment_edits_history').insertOne).not.toHaveBeenCalled()
        })
    })

    it('createdAt 只在第一次建立時寫入，修改留言不會被更新', async () => {
        await createCommentAction('news-1', '標題', '內容', 5)

        const update = collection('comments').findOneAndUpdate.mock.calls[0]?.[1]
        expect(update.$setOnInsert).toHaveProperty('createdAt')
        expect(update.$set).not.toHaveProperty('createdAt')
    })

    it('寫入失敗時回傳錯誤', async () => {
        collection('comments').findOneAndUpdate.mockResolvedValue(null)

        expect(await createCommentAction('news-1', '標題', '內容', 5)).toEqual({
            success: false,
            error: 'Failed to save comment',
        })
    })

    it('資料庫丟出例外時回傳錯誤', async () => {
        collection('comments').findOneAndUpdate.mockRejectedValue(new Error('boom'))

        expect(await createCommentAction('news-1', '標題', '內容', 5)).toEqual({
            success: false,
            error: 'Internal server error',
        })
    })
})

describe('deleteCommentAction', () => {
    const commentId = new ObjectId().toString()

    beforeEach(() => {
        collection('comments').findOne.mockResolvedValue(makeCommentDoc({ userId: USER_ID }))
    })

    it('未登入時拒絕', async () => {
        requireAuthWithRole.mockResolvedValue({
            authenticated: false,
            error: 'User not authenticated',
        })

        const result = await deleteCommentAction(commentId)

        expect(result).toEqual({ success: false, error: 'User not authenticated' })
        expect(collection('comments').deleteOne).not.toHaveBeenCalled()
    })

    it('沒有 commentId 時拒絕', async () => {
        expect(await deleteCommentAction('')).toEqual({
            success: false,
            error: 'commentId is required',
        })
    })

    it('刪除成功，並回傳更新後的評分現況', async () => {
        // 刪掉評論等於也移除了它的評分，呼叫端要能把星等換掉
        collection('comments').aggregateCursor.toArray.mockResolvedValue([{ _id: null, avg: 4 }])
        // 第一次 findOne 是刪除前的查詢，第二次是 getRatingSummary 找自己的評論
        collection('comments')
            .findOne.mockResolvedValueOnce(makeCommentDoc())
            .mockResolvedValue(null)

        expect(await deleteCommentAction(commentId)).toEqual({
            success: true,
            message: 'Comment deleted',
            rating: { averageRating: 4, userRating: 0 },
        })
    })

    it('刪掉自己那則後 userRating 歸零，表單不會還亮著星等', async () => {
        collection('comments').aggregateCursor.toArray.mockResolvedValue([])
        collection('comments')
            .findOne.mockResolvedValueOnce(makeCommentDoc())
            .mockResolvedValue(null)

        expect(await deleteCommentAction(commentId)).toMatchObject({
            rating: { averageRating: 0, userRating: 0 },
        })
    })

    it('commentId 格式不合法時不會讓 ObjectId 的例外外洩', async () => {
        expect(await deleteCommentAction('not-an-object-id')).toEqual({
            success: false,
            error: 'Internal server error',
        })
    })

    describe('管理員', () => {
        it('可以刪任何人的留言——查詢條件不綁 userId', async () => {
            requireAuthWithRole.mockResolvedValue({
                authenticated: true,
                user: makeUser(),
                isAdmin: true,
            })

            await deleteCommentAction(commentId)

            expect(collection('comments').findOne).toHaveBeenCalledWith({
                _id: new ObjectId(commentId),
            })
        })

        it('一般使用者的條件仍然綁 userId，刪不掉別人的', async () => {
            // 這是整個功能最重要的一條：server action 是公開端點，
            // 前端不顯示按鈕擋不住任何人帶著別人的 commentId 呼叫
            await deleteCommentAction(commentId)

            expect(collection('comments').findOne).toHaveBeenCalledWith({
                _id: new ObjectId(commentId),
                userId: USER_ID,
            })
        })

        it('權限判定完全來自伺服器，呼叫端無從影響', async () => {
            // deleteCommentAction 只收 commentId，沒有任何參數能左右權限
            await deleteCommentAction(commentId)

            expect(requireAuthWithRole).toHaveBeenCalledWith()
        })
    })

    describe('軟刪除', () => {
        it('不是真的刪掉，而是標記——留下審核軌跡也保住關聯', async () => {
            await deleteCommentAction(commentId)

            expect(collection('comments').deleteOne).not.toHaveBeenCalled()
            const update = collection('comments').updateOne.mock.calls[0]?.[1]
            expect(update.$set).toMatchObject({ deletedBy: USER_ID })
            expect(update.$set.deletedAt).toBeTruthy()
        })

        it('本人自刪：deletedByAdmin 為 false', async () => {
            collection('comments').findOne.mockResolvedValue(makeCommentDoc({ userId: USER_ID }))

            await deleteCommentAction(commentId)

            const update = collection('comments').updateOne.mock.calls[0]?.[1]
            expect(update.$set.deletedByAdmin).toBe(false)
        })

        it('管理員刪別人的：deletedByAdmin 為 true', async () => {
            requireAuthWithRole.mockResolvedValue({
                authenticated: true,
                user: makeUser(),
                isAdmin: true,
            })
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ userId: OTHER_USER_ID })
            )

            await deleteCommentAction(commentId)

            const update = collection('comments').updateOne.mock.calls[0]?.[1]
            expect(update.$set.deletedByAdmin).toBe(true)
        })

        it('管理員刪自己的仍算自刪，不會顯示成違規下架', async () => {
            requireAuthWithRole.mockResolvedValue({
                authenticated: true,
                user: makeUser(),
                isAdmin: true,
            })
            collection('comments').findOne.mockResolvedValue(makeCommentDoc({ userId: USER_ID }))

            await deleteCommentAction(commentId)

            const update = collection('comments').updateOne.mock.calls[0]?.[1]
            expect(update.$set.deletedByAdmin).toBe(false)
        })

        it('已經刪過的不重複標記', async () => {
            collection('comments').findOne.mockResolvedValue(
                makeCommentDoc({ deletedAt: '2026-08-07T00:00:00.000Z' })
            )

            expect(await deleteCommentAction(commentId)).toEqual({
                success: false,
                error: 'Comment already deleted',
            })
            expect(collection('comments').updateOne).not.toHaveBeenCalled()
        })

        it('找不到或無權限時不做任何事', async () => {
            collection('comments').findOne.mockResolvedValue(null)

            expect(await deleteCommentAction(commentId)).toEqual({
                success: false,
                error: 'Comment not found or unauthorized',
            })
            expect(collection('comments').updateOne).not.toHaveBeenCalled()
        })
    })
})
