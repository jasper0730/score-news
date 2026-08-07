'use client'

import { useShallow } from 'zustand/shallow'
import { useNewsStore } from '@/store/newsStore'
import type { SortType } from '@/types/news'

const SORT_OPTIONS: { value: SortType; label: string }[] = [
    { value: 'date_desc', label: '最新文章' },
    { value: 'views', label: '最多瀏覽' },
    { value: 'favorites', label: '最多收藏' },
    { value: 'rating_desc', label: '最高評分' },
    { value: 'likes', label: '最多讚' },
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
            aria-label="排序方式"
            className="cursor-pointer rounded-md border border-input bg-surface px-3 py-1.5 text-sm transition-colors focus:border-ring"
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
