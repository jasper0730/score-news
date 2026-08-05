'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/libs/cn'

type ButtonVariant =
    | 'primary'
    | 'outline'
    | 'ghost'
    | 'brand'
    | 'social-facebook'
    | 'social-google'
    | 'social-github'

type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
    icon?: ReactNode
}

const BASE_CLASSES =
    'inline-flex cursor-pointer items-center justify-center gap-1 rounded-md transition duration-300 disabled:cursor-not-allowed disabled:opacity-50'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: 'rounded-xl border-2 hover:opacity-70',
    outline:
        'border border-input text-muted-foreground hover:border-foreground hover:text-foreground',
    ghost: 'border border-input hover:bg-muted',
    // 漸層在夜間是亮的、日間是暗的，所以字色跟著 background 反轉才讀得清楚
    brand: 'rounded-lg bg-gradient-to-r from-brand-from to-brand-to font-medium text-background hover:opacity-90',
    'social-facebook': 'rounded-xl bg-social-facebook text-white hover:opacity-70',
    'social-google': 'rounded-xl bg-social-google text-white hover:opacity-70',
    'social-github': 'rounded-xl bg-social-github text-white hover:opacity-70',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-2.5',
}

const Button = ({
    children,
    className,
    variant,
    size = 'md',
    fullWidth = false,
    type = 'button',
    icon,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={cn(
                BASE_CLASSES,
                SIZE_CLASSES[size],
                variant && VARIANT_CLASSES[variant],
                fullWidth && 'w-full',
                className
            )}
            type={type}
            {...props}
        >
            {children}
            {icon}
        </button>
    )
}

export default Button
