'use client'

import { useState } from 'react'
import { useNewsStore } from '@/store/newsStore'
import { useShallow } from 'zustand/shallow'
import { IoIosCloseCircleOutline } from 'react-icons/io'
import { IoSearch } from 'react-icons/io5'

interface SearchBarProps {
    className?: string
}

const SearchBar = ({ className = '' }: SearchBarProps) => {
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
        <div className={`search-bar ${className}`}>
            <button
                type="button"
                onClick={handleSearch}
                className="search-bar__button"
            >
                <IoSearch className="search-bar__icon" />
            </button>
            <div className="search-bar__input-wrapper">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="搜尋內容..."
                    className="search-bar__input"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="search-bar__clear"
                    >
                        <IoIosCloseCircleOutline size={20} />
                    </button>
                )}
            </div>
        </div>
    )
}

export default SearchBar
