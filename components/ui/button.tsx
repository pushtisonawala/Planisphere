// Button.tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "solid";
  onClick?: () => void;  // Make onClick optional
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = "solid", 
  onClick, 
  children, 
  className = "",
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded focus:outline-none transition duration-200";
  const solidStyles = "bg-indigo-600 text-white hover:bg-indigo-500";
  const outlineStyles = "border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white";

  const variantStyles = variant === "outline" ? outlineStyles : solidStyles;

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};