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
      className={`rounded border border-slate-200 bg-white p-5 shadow-xs ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
          <div>
            {title && <h4 className="text-base font-bold text-slate-900">{title}</h4>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
