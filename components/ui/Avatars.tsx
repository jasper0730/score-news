'use client'

import React from 'react'
import Image from 'next/image'

type  AvatarsProps = {
  src?: string | null
}

const Avatar: React.FC<AvatarsProps> = ({ src }) => {
  return (
    <Image
      alt="avatars"
      className="rounded-full object-cover"
      src={src ?? '/images/placeholder.jpg'}
      fill
      priority
    />
  )
}

export default Avatar
