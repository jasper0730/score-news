"use client"
import { useSession } from 'next-auth/react';
import Image from 'next/image'
import { NewsDataType } from "@/types/news";
import { IoIosCloseCircle } from "react-icons/io";
import Rating from './Rating';
import DynamicImage from '../DynamicImage';

type NewsDetailProps = {
  data: NewsDataType | null;
  onClose: () => void;
  onRatingUpdate: (postId: string, newRating: number) => void;
}
const NewsDetail = ({ data, onClose, onRatingUpdate }: NewsDetailProps) => {
  const currentUser = useSession()
  const isAdmin = currentUser.status === 'authenticated'

  const newsContent = data?.content && data?.content !== "ONLY AVAILABLE IN PAID PLANS"
    ? data?.content
    : `我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，`
  return (
    <>
      <div className="m-auto px-5 py-20 relative bg-white rounded-lg dark:bg-gray-900 md:px-10">
        <IoIosCloseCircle onClick={onClose} size={40} className="absolute top-[20px] left-[50%] translate-x-[-50%] cursor-pointer hover:rotate-90 duration-300" />
        <div className="flex flex-col gap-8 md:flex-row">
          <div className='max-w-[400px] relative mx-auto md:w-1/2 md:max-w-none'>
            {data?.image_url
              ? (
                <DynamicImage
                  src={data.image_url}
                  alt={data?.title || "新聞圖片"}
                  className="object-cover w-full h-auto rounded-lg"
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
          <div className='md:w-1/2'>
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