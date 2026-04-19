'use client'

import { useShallow } from 'zustand/shallow'
import { useNewsStore } from '@/store/newsStore'
import Button from '@/components/atoms/Button'
import type { SortType } from '@/types/news'

interface SortButtonProps {
    type: SortType
}

const SORT_LABELS: Record<SortType, string> = {
    rating_desc: '評分最高',
    rating_asc: '評分最低',
    date_desc: '最新',
    date_asc: '最舊',
    views: '最多瀏覽',
}

const SortButton = ({ type }: SortButtonProps) => {
    const { sortType, setSortType } = useNewsStore(
        useShallow((state) => ({
            sortType: state.sortType,
            setSortType: state.setSortType,
        }))
    )

    const isActive = sortType === type

    return (
        <Button
            className={`flex justify-center items-center gap-1 w-full bg-gray-100 py-2 px-3 text-sm hover:bg-slate-800 hover:text-white duration-300 dark:bg-slate-800 dark:hover:opacity-100 md:w-[150px] dark:opacity-70 ${
                isActive ? 'text-white bg-slate-800 dark:opacity-100' : ''
            }`}
            onClick={() => setSortType(type)}
        >
            {SORT_LABELS[type]}
        </Button>
    )
}

export default SortButton
