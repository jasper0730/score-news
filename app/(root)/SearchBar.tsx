"use client";

import { useNewsStore } from "@/store/newsStore";
import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { IoSearch } from "react-icons/io5";

const SearchBar = ({ className }: { className: string }) => {
  const [query, setQuery] = useState("");
  const { setNewsQuery } = useNewsStore(useShallow((state) => ({
    setNewsQuery: state.setNewsQuery,
  })));

  const handleSearch = () => {
    setNewsQuery(query);
  }

  const handleClear = () => {
    setQuery("");
    setNewsQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={`flex items-stretch gap-2 p-2 border-b-8 w-full  ${className}`}>
      <button
        type="button"
        onClick={handleSearch}
        className="px-3 py-2  duration-300 rounded-md hover:opacity-70"
      >
        <IoSearch className="text-[60px]" />
      </button>
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜尋內容..."
          className="w-full h-full flex-1 pl-3 py-2 pr-8 rounded-md focus:outline-none text-xl bg-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-[50%] translate-y-[-50%] focus:outline-none"
          >
            <IoIosCloseCircleOutline size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
