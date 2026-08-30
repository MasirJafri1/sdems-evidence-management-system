import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    danger: 'bg-red-50 text-red-800 border-red-300',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
