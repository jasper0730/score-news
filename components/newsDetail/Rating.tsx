"use client"

import { toastBox } from '@/utils/toast';
import axios from 'axios';
import { useState } from 'react';
import { FaStar } from "react-icons/fa";
import Button from '../Button';

type RatingProps = {
  postId: string | undefined;
  onRatingUpdate: (postId: string, newRating: number) => void;
}
export default function Rating({ postId, onRatingUpdate }: RatingProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`/api/rating`, { id: postId, rate: rating });
      const { data } = res;
      if (data.state === "success") {
        toastBox("評分已送出", "success");
        console.log(data)
        onRatingUpdate(postId ?? '', data.rate)
      } else {
        throw new Error("Failed to update rating");
      }
    } catch (error) {
      console.error(error);
      toastBox("操作異常,請稍後再試", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <h3 className="text-lg font-semibold mb-2">你覺得這則新聞?</h3>
      <div className='flex items-center gap-5'>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={`
                ${(hover || rating) >= star ? "text-yellow-500" : "text-gray-400"}
                cursor-pointer text-2xl`}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating((prev) => (prev === star ? 0 : star))}
            />
          ))}
        </div>
        <Button
          className={`
            ${rating === 0 || isLoading ? 'opacity-30 pointer-events-none' : 'opacity-100 pointer-events-auto'} 
            px-2 py-1 border rounded-md w-[100px] cursor-pointer
          `}
          disabled={isLoading || rating === 0}
          onClick={handleClick}
        >{isLoading ? '傳送中...' : '傳送評分'}</Button>
      </div>
    </div>
  )
}
