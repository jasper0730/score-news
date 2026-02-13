'use client'

import { useShallow } from 'zustand/shallow'
import { useNewsStore } from '@/store/newsStore'
import Button from '@/components/atoms/Button'
import type { SortType } from '@/types/news'

interface SortButtonProps {
    type: SortType
}

const SORT_LABELS: Record<SortType, string> = {
    rating: '評分最高',
    date: '最新',
}

const SortButton = ({ type }: SortButtonProps) => {
    const { sortType, setSortType } = useNewsStore(
        useShallow((state) => ({
            sortType: state.sortType,
            setSortType: state.setSortType,
        }))
    )

    const isActive = sortType === type
    const activeClass = isActive ? 'sort-button--active' : ''

    return (
        <Button
            className={`sort-button ${activeClass}`}
            onClick={() => setSortType(type)}
        >
            {SORT_LABELS[type]}
        </Button>
    )
}

export default SortButton
