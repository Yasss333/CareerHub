import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

    let variantStyles = 'bg-primary text-primary-foreground hover:bg-primary/90';
    if (variant === 'outline') {
      variantStyles = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
    } else if (variant === 'ghost') {
      variantStyles = 'hover:bg-accent hover:text-accent-foreground text-inherit';
    } else if (variant === 'secondary') {
      variantStyles = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    } else if (variant === 'link') {
      variantStyles = 'text-primary underline-offset-4 hover:underline';
    }

    let sizeStyles = 'h-10 px-4 py-2 text-sm rounded-md';
    if (size === 'sm') sizeStyles = 'h-9 rounded-md px-3 text-xs';
    if (size === 'lg') sizeStyles = 'h-11 rounded-md px-8 text-base';
    if (size === 'icon') sizeStyles = 'h-10 w-10 p-0';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`.trim()}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
