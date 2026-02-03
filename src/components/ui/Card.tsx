'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl';

    const variants = {
      default: 'shadow-sm',
      bordered: 'border border-gray-200',
      elevated: 'shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-4 border-b border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 py-4 border-t border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
