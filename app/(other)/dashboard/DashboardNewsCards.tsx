"use client"
import Card from '@/components/Card/Card';
import { NewsDataType } from '@/types/news';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

type DashboardNewsCardsProps = {
  user: { id: string } | null
}

const DashboardNewsCards = ({ user }: DashboardNewsCardsProps) => {
  const [newsData, setNewsData] = useState<NewsDataType[]>([])
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`/api/news`, {
        params: {
          userId: user?.id || null
        }
      })
      const fetchedNews:NewsDataType[] = res.data.data;
      setNewsData(fetchedNews.filter(item => item.favorite));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFavoriteClick = async (id: string) => {
    try {
      const res = await axios.post("/api/favorite", { id });
      if (!res.data.success) {
        throw new Error("Failed to update favorite");
      }
      setNewsData(prev => prev.filter(item => item.article_id !== id));
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  };
  return (
    <div className="min-h-screen p-4">
      {newsData.length ? (
        <div className="grid grid-cols-4 gap-4">
          {newsData.map((data: NewsDataType) => (
            <Card
              key={data.article_id}
              articleId={data.article_id}
              title={data.title}
              description={data.description}
              date={data.pubDate}
              sourceIcon={data.source_icon}
              sourceName={data.source_name}
              sourceUrl={data.source_url}
              rate={data.rate}
              favorite={true}
              onFavoriteClick={handleFavoriteClick}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-xl p-10">目前沒有收藏的新聞</p>
      )}
    </div>
  );
};

export default DashboardNewsCards;