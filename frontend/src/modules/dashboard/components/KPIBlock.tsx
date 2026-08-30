import React from 'react';

interface KPIBlockProps {
  title: string;
  value: string | number;
  subtitle?: string;
  statusColor?: 'emerald' | 'amber' | 'blue' | 'slate';
}

export const KPIBlock: React.FC<KPIBlockProps> = ({
  title,
  value,
  subtitle,
  statusColor = 'slate',
}) => {
  const borderColors = {
    emerald: 'border-l-emerald-600',
    amber: 'border-l-amber-500',
    blue: 'border-l-blue-700',
    slate: 'border-l-slate-800',
  };

  return (
    <div className={`p-4 rounded border border-slate-200 bg-white border-l-4 ${borderColors[statusColor]} shadow-xs`}>
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-slate-500 mt-1 font-medium">{subtitle}</div>
      )}
    </div>
  );
};
