'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'primary' | 'outline' | 'social-facebook' | 'social-google' | 'social-github'
    icon?: ReactNode
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'btn btn--primary',
    outline: 'btn btn--outline',
    'social-facebook': 'btn btn--social btn--social-facebook',
    'social-google': 'btn btn--social btn--social-google',
    'social-github': 'btn btn--social btn--social-github',
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
