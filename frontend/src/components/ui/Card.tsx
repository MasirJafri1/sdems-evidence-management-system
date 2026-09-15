import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-md border border-[#DCE3EA] bg-white p-5 shadow-2xs ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#DCE3EA]">
          <div>
            {title && <h4 className="text-sm font-bold text-[#123B63] uppercase tracking-wide">{title}</h4>}
            {subtitle && <p className="text-xs text-[#5B6875] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
