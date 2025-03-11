"use client"
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { toastBox } from '@/utils/toast';
import axios from 'axios';
import { NewsDataType } from '@/types/news';
import Loader from '@/components/Loader';
import Card from '@/components/Card';
import NewsModal from '@/components/NewsModal';

type DashboardNewsListProps = {
  user: { id: string } | null;
};

const DashboardNewsList = ({ user }: DashboardNewsListProps) => {
  const router = useRouter()
  const [selectedNews, setSelectedNews] = useState<NewsDataType | null>(null);
  const [newsData, setNewsData] = useState<NewsDataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  if (!user) {
    router.push('/login')
  };
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/news`, {
        params: { userId: user?.id }
      });

      const fetchedNews: NewsDataType[] = res.data.data || [];
      setNewsData(fetchedNews.filter(item => item.favorite));
      setHasFetched(true);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
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
    try {
      const res = await axios.post("/api/favorite", { id });
      if (!res.data.success) {
        throw new Error("Failed to update favorite");
      }
      setNewsData(prev => prev.filter(item => item.article_id !== id));
      toastBox("移除收藏", "success")
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  };

  if (isLoading && !hasFetched) return <Loader />;
  if (!isLoading && !newsData.length) return (
    <div className="p-10">
      <p className="text-center text-xl p-10">目前沒有收藏的新聞，請回<Link href='/' className='text-red-500  hover:opacity-70'>首頁</Link>加入收藏文章</p>
    </div>
  )

  return (
    <>
      <div className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
          {newsData.map((article: NewsDataType) => (
            <Card
              key={article.article_id}
              article={article}
              favorite={true}
              onFavoriteClick={handleFavoriteClick}
              onMoreClick={() => setSelectedNews(article)}
            />
          ))}
        </div>
      </div>
      <NewsModal
        data={selectedNews}
        onClose={() => setSelectedNews(null)}
        onRatingUpdate={handleRatingUpdate}
        open={selectedNews !== null}
      />
    </>
  );
};

export default DashboardNewsList;
