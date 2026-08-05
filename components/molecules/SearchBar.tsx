'use client'

import { useState } from 'react'
import { useNewsStore } from '@/store/newsStore'
import { useShallow } from 'zustand/shallow'
import { IoIosCloseCircleOutline } from 'react-icons/io'
import { IoSearch } from 'react-icons/io5'
import { cn } from '@/libs/cn'

interface SearchBarProps {
    className?: string
}

const SearchBar = ({ className }: SearchBarProps) => {
    const [query, setQuery] = useState('')
    const { setNewsQuery } = useNewsStore(
        useShallow((state) => ({
            setNewsQuery: state.setNewsQuery,
        }))
    )

    const handleSearch = () => {
        setNewsQuery(query)
    }

    const handleClear = () => {
        setQuery('')
        setNewsQuery('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className={cn('flex w-full items-stretch gap-2 border-b-8 p-2', className)}>
            <button
                type="button"
                onClick={handleSearch}
                className="rounded-md px-3 py-2 transition duration-300 hover:opacity-70"
                aria-label="搜尋"
            >
                <IoSearch className="text-6xl" />
            </button>
            <div className="relative w-full">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="搜尋內容..."
                    aria-label="搜尋新聞"
                    className="h-full w-full flex-1 rounded-md bg-transparent py-2 pl-3 pr-8 text-xl"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        aria-label="清除搜尋"
                    >
                        <IoIosCloseCircleOutline size={20} />
                    </button>
                )}
            </div>
        </div>
    )
}

export default SearchBar
