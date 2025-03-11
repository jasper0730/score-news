"use client";

import { useEffect, useMemo, useState } from "react";
import { useNewsStore } from "@/store/newsStore";
import { useShallow } from "zustand/shallow";
import { toastBox } from "@/utils/toast";
import { NewsDataType } from "@/types/news";
import axios from "axios";
import Card from "@/components/Card";
import NewsModal from "@/components/NewsModal";

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

  const handleRatingUpdate = async (postId: string, newRating: number) => {
    try {
      const response = await axios.post("/api/rating", { id: postId, rate: newRating });
      if (response.data.state === "success") {
        const updatedRating = response.data.rate;

        setNewsData((prevData) =>
          prevData.map((news) =>
            news.article_id === postId
              ? { ...news, rate: updatedRating }
              : news
          )
        );

        if (selectedNews && selectedNews.article_id === postId) {
          setSelectedNews((prev) =>
            prev ? { ...prev, rate: updatedRating } : null
          );
        }
      }
    } catch (error) {
      console.error("Failed to update rating:", error);
    }
  };

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
        toastBox("移除收藏", "success");
      }
      if (res.data.message === "Favorite added") {
        toastBox("已收藏", "success");
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
      const aRate = a.rate || 0;
      const bRate = b.rate || 0;
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
    <div className="min-h-screen px-4 py-10">
      {sortedData.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      <NewsModal
        data={selectedNews}
        onClose={() => setSelectedNews(null)}
        onRatingUpdate={handleRatingUpdate}
        open={selectedNews !== null}
      />

    </div>
  );
};

export default NewsList;
