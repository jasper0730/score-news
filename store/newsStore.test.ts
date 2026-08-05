import { beforeEach, describe, expect, it } from 'vitest'
import { useNewsStore } from '@/store/newsStore'

describe('useNewsStore', () => {
    // store 是 module 層級的單例，測試之間必須自己還原，
    // 否則前一個測試設過的 query 會被下一個測試看到
    const initialState = useNewsStore.getState()
    beforeEach(() => {
        useNewsStore.setState(initialState, true)
    })

    it('預設是空搜尋字串、依日期新到舊排序', () => {
        const { query, sortType } = useNewsStore.getState()
        expect(query).toBe('')
        expect(sortType).toBe('date_desc')
    })

    it('setNewsQuery 更新搜尋字串且不影響排序', () => {
        useNewsStore.getState().setNewsQuery('颱風')

        expect(useNewsStore.getState().query).toBe('颱風')
        expect(useNewsStore.getState().sortType).toBe('date_desc')
    })

    it('setSortType 更新排序且不影響搜尋字串', () => {
        useNewsStore.getState().setNewsQuery('颱風')
        useNewsStore.getState().setSortType('rating_desc')

        expect(useNewsStore.getState().sortType).toBe('rating_desc')
        expect(useNewsStore.getState().query).toBe('颱風')
    })

    it('會通知訂閱者', () => {
        const seen: string[] = []
        const unsubscribe = useNewsStore.subscribe((state) => seen.push(state.query))

        useNewsStore.getState().setNewsQuery('地震')
        unsubscribe()
        useNewsStore.getState().setNewsQuery('取消訂閱後不該收到')

        expect(seen).toEqual(['地震'])
    })
})
