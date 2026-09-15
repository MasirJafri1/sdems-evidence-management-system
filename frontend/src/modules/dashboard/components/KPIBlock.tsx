import React from 'react';

interface KPIBlockProps {
  title: string;
  value: string | number;
  subtitle?: string;
  statusColor?: 'emerald' | 'amber' | 'blue' | 'slate' | 'red';
  icon?: React.ReactNode;
}

export const KPIBlock: React.FC<KPIBlockProps> = ({
  title,
  value,
  subtitle,
  statusColor = 'blue',
  icon,
}) => {
  const iconBgs = {
    blue: 'bg-[#EBF3FA] text-[#123B63] border-[#B8D3EA]',
    emerald: 'bg-[#E6F4ED] text-[#18794E] border-[#B2DDCE]',
    amber: 'bg-[#FFF8E6] text-[#A66A00] border-[#FDE68A]',
    red: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
    slate: 'bg-[#F6F8FB] text-[#5B6875] border-[#DCE3EA]',
  };

  return (
    <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-[#5B6875] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={`p-1.5 rounded-md border text-xs ${iconBgs[statusColor]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold text-[#123B63] font-mono tracking-tight">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-[#5B6875] mt-1 font-medium flex items-center gap-1">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
