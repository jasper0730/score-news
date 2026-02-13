import { create } from 'zustand'
import type { SortType } from '@/types/news'

interface NewsStoreState {
    query: string
    setNewsQuery: (query: string) => void
    sortType: SortType
    setSortType: (type: SortType) => void
}

export const useNewsStore = create<NewsStoreState>((set) => ({
    query: '',
    sortType: 'date',
    setNewsQuery: (query) => set({ query }),
    setSortType: (type) => set({ sortType: type }),
}))
