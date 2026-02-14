'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'primary' | 'outline' | 'social-facebook' | 'social-google' | 'social-github'
    icon?: ReactNode
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'inline-flex items-center justify-center gap-1 cursor-pointer transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 border-2 w-full rounded-xl hover:opacity-70',
    outline: 'inline-flex items-center justify-center gap-1 cursor-pointer transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md border border-gray-300 text-gray-400 hover:border-gray-700 hover:text-gray-700',
    'social-facebook': 'inline-flex items-center justify-center gap-1 cursor-pointer transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 border-2 w-full rounded-xl border-none text-white hover:opacity-70 bg-blue-500',
    'social-google': 'inline-flex items-center justify-center gap-1 cursor-pointer transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 border-2 w-full rounded-xl border-none text-white hover:opacity-70 bg-red-500',
    'social-github': 'inline-flex items-center justify-center gap-1 cursor-pointer transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 border-2 w-full rounded-xl border-none text-white hover:opacity-70 bg-gray-600',
}

const Button = ({
    children,
    className = '',
    variant,
    type = 'button',
    onClick,
    disabled,
    icon,
    ...props
}: ButtonProps) => {
    const variantClass = variant ? VARIANT_CLASSES[variant] : ''

    return (
        <button
            className={`${variantClass} ${className}`}
            type={type}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
            {icon}
        </button>
    )
}

export default Button
