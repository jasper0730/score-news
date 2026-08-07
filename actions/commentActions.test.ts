import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { collection } from '@/test/helpers/db'
import { makeCommentDoc, makeUser, makeUserDoc, USER_ID } from '@/test/helpers/fixtures'

vi.mock('@/libs/db', async () => ({
    getCollection: (await import('@/test/helpers/db')).getCollection,
}))

const requireAuth = vi.hoisted(() => vi.fn())
const requireAuthWithRole = vi.hoisted(() => vi.fn())
vi.mock('@/libs/auth', () => ({ requireAuth, requireAuthWithRole }))

const { getCommentsByPostId, getCommentsByUserId, createCommentAction, deleteCommentAction } =
    await import('@/actions/commentActions')

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

        expect(collection('comments').find).toHaveBeenCalledWith({ postId: 'news-1' })
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
})

describe('getCommentsByUserId', () => {
    it('依使用者取留言，新的排前面', async () => {
        collection('comments').cursor.toArray.mockResolvedValue([makeCommentDoc()])

        const result = await getCommentsByUserId(USER_ID)

        expect(collection('comments').find).toHaveBeenCalledWith({ userId: USER_ID })
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

    it('刪除條件同時綁定 userId，避免刪到別人的留言', async () => {
        await deleteCommentAction(commentId)

        expect(collection('comments').deleteOne).toHaveBeenCalledWith({
            _id: new ObjectId(commentId),
            userId: USER_ID,
        })
    })

    it('留言不存在或不屬於自己時回傳錯誤', async () => {
        collection('comments').deleteOne.mockResolvedValue({ deletedCount: 0 })

        expect(await deleteCommentAction(commentId)).toEqual({
            success: false,
            error: 'Comment not found or unauthorized',
        })
    })

    it('刪除成功', async () => {
        collection('comments').deleteOne.mockResolvedValue({ deletedCount: 1 })

        expect(await deleteCommentAction(commentId)).toEqual({
            success: true,
            message: 'Comment deleted',
        })
    })

    it('commentId 格式不合法時不會讓 ObjectId 的例外外洩', async () => {
        expect(await deleteCommentAction('not-an-object-id')).toEqual({
            success: false,
            error: 'Internal server error',
        })
    })

    describe('管理員', () => {
        it('可以刪任何人的留言——刪除條件不綁 userId', async () => {
            requireAuthWithRole.mockResolvedValue({
                authenticated: true,
                user: makeUser(),
                isAdmin: true,
            })

            await deleteCommentAction(commentId)

            expect(collection('comments').deleteOne).toHaveBeenCalledWith({
                _id: new ObjectId(commentId),
            })
        })

        it('一般使用者的條件仍然綁 userId，刪不掉別人的', async () => {
            // 這是整個功能最重要的一條：server action 是公開端點，
            // 前端不顯示按鈕擋不住任何人帶著別人的 commentId 呼叫
            await deleteCommentAction(commentId)

            expect(collection('comments').deleteOne).toHaveBeenCalledWith({
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
})
