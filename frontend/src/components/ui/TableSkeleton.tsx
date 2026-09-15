import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-[#DCE3EA] bg-white">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-3">
              <div className="h-4 bg-gradient-to-r from-[#F6F8FB] via-[#EBF3FA] to-[#F6F8FB] rounded w-5/6" />
              {cIdx === 0 && <div className="h-3 bg-[#F6F8FB] rounded w-1/2 mt-1.5" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 bg-white border border-[#DCE3EA] rounded-md shadow-2xs space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-[#EBF3FA] rounded w-1/3" />
            <div className="h-4 bg-[#F6F8FB] rounded w-1/4" />
          </div>
          <div className="h-5 bg-[#EBF3FA] rounded w-3/4" />
          <div className="h-3 bg-[#F6F8FB] rounded w-1/2" />
          <div className="pt-2 border-t border-[#DCE3EA] flex justify-between">
            <div className="h-3 bg-[#F6F8FB] rounded w-1/4" />
            <div className="h-3 bg-[#F6F8FB] rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const KPIBlockSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="p-4 bg-white border border-[#DCE3EA] rounded-md shadow-2xs animate-pulse space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-[#F6F8FB] rounded w-1/2" />
            <div className="w-6 h-6 bg-[#EBF3FA] rounded-md" />
          </div>
          <div className="h-7 bg-[#EBF3FA] rounded w-1/3" />
          <div className="h-3 bg-[#F6F8FB] rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
