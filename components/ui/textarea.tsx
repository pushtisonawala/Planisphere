import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  return (
    <textarea className={`border px-4 py-2 rounded focus:outline-none focus:ring ${className}`} {...props} />
  );
};
