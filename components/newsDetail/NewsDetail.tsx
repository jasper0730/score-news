"use client"
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image'
import { NewsDataType } from "@/types/news";
import { IoIosCloseCircle } from "react-icons/io";
import Rating from './Rating';

type NewsDetailProps = {
  data: NewsDataType | null;
  onClose: () => void;
  onRatingUpdate: (postId: string, newRating: number) => void;
}
const NewsDetail = ({ data, onClose, onRatingUpdate }: NewsDetailProps) => {
  const currentUser = useSession()
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const isAdmin = currentUser.status === 'authenticated'

  const newsContent = data?.content && data?.content !== "ONLY AVAILABLE IN PAID PLANS"
    ? data?.content
    : `我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，`
  return (
    <>
      <div className="m-auto p-20 relative bg-white dark:bg-gray-900 rounded-lg">
        <IoIosCloseCircle onClick={onClose} size={40} className="absolute top-[20px] left-[50%] cursor-pointer hover:rotate-90 duration-300" />
        <div className="flex gap-8">
          <div className='w-1/2 relative'>
            {data?.image_url
              ? (
                <Image
                  src={data.image_url}
                  alt={data?.title || "新聞圖片"}
                  width={imageSize.width}
                  height={imageSize.height}
                  className="object-cover w-full h-auto rounded-lg"
                  onLoadingComplete={(img) => {
                    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                />
              ) : (
                <Image
                  src="/images/no-image.jpg"
                  alt={data?.title || "無圖片"}
                  fill
                />
              )
            }
          </div>
          <div className='w-1/2'>
            <h2 className="text-xl font-bold">{data?.title}</h2>
            <p className="text-gray-600">{data?.description}</p>
          </div>
        </div>
        <div className="mt-5">
          <p>{newsContent}</p>
        </div>
        {isAdmin && (
          <div className="mt-8">
            <Rating postId={data?.article_id} onRatingUpdate={onRatingUpdate} />
          </div>
        )}
      </div>
    </>
  );
}

export default NewsDetail;