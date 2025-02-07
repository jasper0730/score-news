"use client"
import { useState } from 'react';
import Image from 'next/image'
import { NewsDataType } from "@/types/news";
import { IoIosCloseCircle } from "react-icons/io";
import { FaStar } from "react-icons/fa";


type NewsDetailProps = {
  data: NewsDataType | null;
  onClose: () => void;
}
const NewsDetail = ({ data, onClose }: NewsDetailProps) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const newsContent = data?.content && data?.content !== "ONLY AVAILABLE IN PAID PLANS"
    ? data?.content
    : `我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，我是預設內容，`
  return (
    <>
      <div className=" p-20 relative bg-white dark:bg-gray-900 rounded-lg">
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
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">評分:</h3>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`cursor-pointer text-2xl ${(hover || rating) >= star ? "text-yellow-500" : "text-gray-400"
                  }`}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating((prev) => (prev === star ? 0 : star))}

              />
            ))}
          </div>
        </div>
        


      </div>
    </>
  );
}

export default NewsDetail;