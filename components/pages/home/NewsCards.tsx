"use client";

import { useNewsStore } from "@/store/newsStore";
import { useShallow } from "zustand/shallow";
import MasonryLayout from "./MasonryLayout";
import { NewsDataType } from "@/types/news";

interface NewsCardsProps {
  data: {
    data: NewsDataType[];
    success: boolean;
  };
}

const NewsCards = ({ data }: NewsCardsProps) => {
  const { query, sortType } = useNewsStore(
    useShallow((state) => ({
      query: state.query,
      sortType: state.sortType,
    }))
  );

  if (!data.success) {
    return <p>Failed to fetching</p>;
  }

  // 搜尋
  const queryValue = query.trim().toLowerCase();
  const newsData = data.data;
  const filterData = queryValue
    ? newsData.filter(
      (data) =>
        data.title.toLowerCase().includes(queryValue) ||
        data.description.toLowerCase().includes(queryValue)
    )
    : newsData;

  // 排序
  const sortedData = [...filterData].sort((a, b) => {
    const aDate = new Date(a.pubDate).getTime();
    const bDate = new Date(b.pubDate).getTime();
    switch (sortType) {
      case 'rating':
        return b.rate - a.rate;
        break;
      case 'date':
        return bDate - aDate;
        break;
    }

  })
  return (
    <div className="min-h-screen p-4">
      <MasonryLayout items={sortedData} columns={3} />
    </div>
  );
};

export default NewsCards;
