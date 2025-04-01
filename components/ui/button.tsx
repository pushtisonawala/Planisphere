// Button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "solid";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = "solid",
  size = "md",
  onClick, 
  children, 
  className = "",
  ...props 
}) => {
  const baseStyles = "rounded focus:outline-none transition duration-200";
  const variantStyles = variant === "outline" 
    ? "border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
    : "bg-indigo-600 text-white hover:bg-indigo-500";
  
  const sizeStyles = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  }[size];

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};