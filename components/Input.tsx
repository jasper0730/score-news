type InputProps = {
    type?: string
    disabled?: boolean
    className?: string
    placeholder?: string
    ref?: React.RefObject<HTMLInputElement>
    name?: string
    error?: string
    defaultValue?: string
}

const Input = ({
    type = 'text',
    disabled,
    className,
    placeholder,
    ref,
    name,
    error,
    defaultValue,
}: InputProps) => {
    const inputClass = `w-full font-light border-2 rounded-md outline-none transition disabled:opacity-70 disabled:cursor-not-allowed p-2`
    return (
        <div className="relative">
            <input
                name={name}
                ref={ref}
                type={type}
                disabled={disabled}
                className={`
          ${inputClass}
          ${className}
          ${error ? 'border-red-500' : ''}
          ${error ? 'focus:border-red-500' : ''}
          `}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
            {error && (
                <div className="text-red-600 text-sm absolute top-full left-0 px-1">{error}</div>
            )}
        </div>
    )
}

export default Input
