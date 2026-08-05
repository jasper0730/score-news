'use client'

import { type TextareaHTMLAttributes } from 'react'
import { cn } from '@/libs/cn'
import { FIELD_CLASSES } from '@/libs/styles'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = ({ className, ...props }: TextareaProps) => {
    return <textarea className={cn(FIELD_CLASSES, 'resize-none', className)} {...props} />
}

export default Textarea
