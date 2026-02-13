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
    const errorClass = error ? 'input__field--error' : ''

    return (
        <div className={`input ${wrapperClassName}`}>
            <input
                name={name}
                ref={inputRef}
                type={type}
                disabled={disabled}
                className={`input__field ${errorClass}`}
                placeholder={placeholder}
                defaultValue={defaultValue}
                {...props}
            />
            {error && <span className="input__error">{error}</span>}
        </div>
    )
}

export default Input
