'use client'

import { type InputHTMLAttributes, type RefObject } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    error?: string
    inputRef?: RefObject<HTMLInputElement | null>
    wrapperClassName?: string
}

const Input = ({
    type = 'text',
    disabled,
    placeholder,
    inputRef,
    name,
    error,
    defaultValue,
    wrapperClassName = '',
    ...props
}: InputProps) => {
    const errorClass = error ? 'border-red-500 focus:border-red-500' : ''

    return (
        <div className={`relative ${wrapperClassName}`}>
            <input
                name={name}
                ref={inputRef}
                type={type}
                disabled={disabled}
                className={`w-full font-light border-2 rounded-md outline-none transition p-2 disabled:opacity-70 disabled:cursor-not-allowed ${errorClass}`}
                placeholder={placeholder}
                defaultValue={defaultValue}
                {...props}
            />
            {error && <span className="text-red-600 text-sm absolute top-full left-0 px-1">{error}</span>}
        </div>
    )
}

export default Input
