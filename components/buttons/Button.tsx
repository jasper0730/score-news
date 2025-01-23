import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  icon?: ReactNode;
};

const Button = ({
  children,
  className,
  type = "button",
  onClick,
  disabled,
  icon,
  ...props
}: ButtonProps) => {

  return (
    <>
      <button
        className={`${className}`}
        type={type}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
        {icon && icon}
      </button>
    </>
  );
};

export default Button;