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
    success: 'bg-[#E6F4ED] text-[#18794E] border-[#B2DDCE] font-semibold',
    warning: 'bg-[#FFF8E6] text-[#A66A00] border-[#FDE68A] font-semibold',
    danger: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] font-semibold',
    info: 'bg-[#EBF3FA] text-[#2F6B95] border-[#B8D3EA] font-semibold',
    neutral: 'bg-[#F6F8FB] text-[#5B6875] border-[#DCE3EA] font-medium',
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
