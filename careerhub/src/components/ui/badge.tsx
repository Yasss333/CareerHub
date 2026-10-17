import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  let variantStyles = 'bg-primary text-primary-foreground';
  if (variant === 'secondary') variantStyles = 'bg-secondary text-secondary-foreground';
  if (variant === 'destructive') variantStyles = 'bg-destructive text-destructive-foreground';
  if (variant === 'outline') variantStyles = 'text-foreground border border-input';

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantStyles} ${className}`.trim()}
      {...props}
    />
  );
}
