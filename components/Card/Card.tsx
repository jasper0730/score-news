"use client";

import { FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface NewsCardProps {
  articleId: string;
  title: string;
  description: string;
  date: string;
  sourceIcon: string;
  sourceName: string;
  sourceUrl: string;
  rate: number;
  favorite: boolean;
  onFavoriteClick: (articleId: string) => void;
}

const Card = ({
  articleId,
  title,
  description,
  date,
  sourceIcon,
  sourceName,
  sourceUrl,
  rate,
  favorite,
  onFavoriteClick,
}: NewsCardProps) => {
  const currentUser = useSession()
  const isAdmin = currentUser.status === "authenticated"

  return (
    <div className="p-4 border rounded-lg shadow-lg">
      <div className="text-gray-600 dark:text-white flex flex-col justify-between h-full">
        <div>
          <h2 className="text-lg font-bold line-clamp-2">{title}</h2>
          <p className="mt-2 line-clamp-3">{description}</p>
          <p className="mt-2 text-sm">日期：{date}</p>
          <div className="flex items-center mt-4">
            {sourceIcon && (
              <div className="w-6 h-6 mr-2 relative">
                <Image src={sourceIcon} alt={`${sourceName} icon`} fill />
              </div>
            )}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              {sourceName}
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            {Array.from({ length: rate }).map((_, index) => (
              <div key={index} className="text-yellow-500 text-xl">
                <FaStar />
              </div>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => onFavoriteClick(articleId)}
              className="text-red-500 hover:opacity-70"
            >
              {favorite ? <FaHeart /> : <FaRegHeart />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;