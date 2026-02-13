'use client'

import { useState } from 'react'
import Image from 'next/image'

interface DynamicImageProps {
    src: string
    alt: string
    className?: string
}

const DynamicImage = ({ src, alt, className = '' }: DynamicImageProps) => {
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

    return (
        <Image
            src={src}
            alt={alt}
            width={imageSize.width}
            height={imageSize.height}
            className={className}
            onLoad={(event) => {
                const target = event.currentTarget
                setImageSize({
                    width: target.naturalWidth,
                    height: target.naturalHeight,
                })
            }}
        />
    )
}

export default DynamicImage
