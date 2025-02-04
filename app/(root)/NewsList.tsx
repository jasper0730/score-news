"use client";

import { useEffect, useMemo, useState } from "react";
import { useNewsStore } from "@/store/newsStore";
import { useShallow } from "zustand/shallow";
import { NewsDataType } from "@/types/news";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { toastBox } from "@/utils/toast";
import axios from "axios";

type NewsListProps = {
  data: {
    data: NewsDataType[];
    success: boolean;
  };
};

const NewsList = ({ data }: NewsListProps) => {
  const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null);
  const [newsData, setNewsData] = useState<NewsDataType[]>(data.data || []);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { query, sortType } = useNewsStore(
    useShallow((state) => ({
      query: state.query,
      sortType: state.sortType,
    }))
  );

  const queryValue = query.trim().toLowerCase();

  useEffect(() => {
    setNewsData(data.data || []);

    const favoriteIds = data.data
      .filter((item) => item.favorite === true)
      .map((item) => item.article_id);

    setFavorites(favoriteIds);
  }, [data.data]);
  useEffect(() => {
    console.log("sortType:", sortType);
  }, [sortType]);

  const handleFavoriteClick = async (id: string) => {
    // 樂觀更新
    setFavorites((prevFavorites) => (
      prevFavorites.includes(id)
        ? prevFavorites.filter((favId) => favId !== id)
        : [...prevFavorites, id]
    ));

    try {
      const res = await axios.post("/api/favorite", { id });
      if (!res.data.success) {
        throw new Error("Failed to update favorite");
      }
      if (res.data.message === "Favorite removed") {
        toastBox("移除收藏", "success")
      }
      if (res.data.message === "Favorite added") {
        toastBox("已收藏", "success")
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);
      setFavorites((prevFavorites) =>
        prevFavorites.includes(id)
          ? prevFavorites.filter((favId) => favId !== id)
          : [...prevFavorites, id]
      );
    }
  };

  const handleMoreClick = (data: NewsDataType) => {
    setSelectedNews(data);
  };

  const sortedData = useMemo(() => {
    const filterData = newsData.filter(
      (item) =>
        item.title?.toLowerCase().includes(queryValue) ||
        item.description?.toLowerCase().includes(queryValue)
    );

    return filterData.sort((a, b) => {
      const aDate = new Date(a.pubDate).getTime();
      const bDate = new Date(b.pubDate).getTime();
      const aRate = a.rate || 0
      const bRate = b.rate || 0
      switch (sortType) {
        case "rating":
          return bRate - aRate;
        case "date":
          return bDate - aDate;
        default:
          return 0;
      }
    });
  }, [newsData, queryValue, sortType]);

  if (!data.success) {
    return <p>Failed to fetch</p>;
  }

  return (
    <div className="min-h-screen p-4">
      {sortedData.length ? (
        <div className="grid grid-cols-4 gap-4">
          {sortedData.map((article) => (
            <Card
              key={article.article_id}
              article={article}
              favorite={favorites.includes(article.article_id)}
              onFavoriteClick={handleFavoriteClick}
              onMoreClick={() => handleMoreClick(article)}
            />
          ))}
        </div>
      ) : (
        <p className="p-5 pt-10 flex justify-center items-center text-xl">
          無相符的資料，請重新搜尋
        </p>
      )}

      {selectedNews && (
        <Modal open={selectedNews !== null} onClose={() => setSelectedNews(null)}>
          <h1 className="text-xl font-bold">{selectedNews.title}</h1>
          <p className="mt-2">{selectedNews.description}</p>
          <p className="mt-2 text-sm text-gray-500">來源: {selectedNews.source_name}</p>
        </Modal>
      )}
    </div>
  );
};

export default NewsList;
