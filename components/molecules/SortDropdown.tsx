'use client'

import { useShallow } from 'zustand/shallow'
import { useNewsStore } from '@/store/newsStore'
import type { SortType } from '@/types/news'

const SORT_OPTIONS: { value: SortType; label: string }[] = [
    { value: 'date_desc', label: '最新到最舊' },
    { value: 'date_asc', label: '最舊到最新' },
    { value: 'rating_desc', label: '評分：高到低' },
    { value: 'rating_asc', label: '評分：低到高' },
    { value: 'views', label: '最熱門' },
]

const SortDropdown = () => {
    const { sortType, setSortType } = useNewsStore(
        useShallow((state) => ({
            sortType: state.sortType,
            setSortType: state.setSortType,
        }))
    )

    return (
        <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none focus:border-blue-400 transition-colors"
        >
            {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    )
}

export default SortDropdown
