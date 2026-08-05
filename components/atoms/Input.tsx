'use client'

import { useId, type InputHTMLAttributes, type RefObject } from 'react'
import { cn } from '@/libs/cn'
import { FIELD_CLASSES } from '@/libs/styles'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    error?: string
    inputRef?: RefObject<HTMLInputElement | null>
    wrapperClassName?: string
}

const Input = ({ type = 'text', inputRef, error, wrapperClassName, id, ...props }: InputProps) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    return (
        <div className={cn('relative', wrapperClassName)}>
            <input
                id={inputId}
                ref={inputRef}
                type={type}
                className={cn(FIELD_CLASSES, error && 'border-danger focus:border-danger')}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                {...props}
            />
            {error && (
                <span
                    id={errorId}
                    role="alert"
                    className="absolute left-0 top-full px-1 text-sm text-danger"
                >
                    {error}
                </span>
            )}
        </div>
    )
}

export default Input
