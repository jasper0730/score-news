"use client"
import { useState } from 'react';
import Image from 'next/image'

type DynamicImage = {
  src: string;
  alt: string;
  className: string;
}
export default function DynamicImage({
  src,
  alt,
  className
}: DynamicImage) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  return (
    <Image
      src={src}
      alt={alt}
      width={imageSize.width}
      height={imageSize.height}
      className={className}
      onLoad={(img) => {
        setImageSize({ width: img.currentTarget.naturalWidth, height: img.currentTarget.naturalHeight });
      }}
    />
  )
}
