import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <div className="p-3.5 rounded-md border border-[#FDE68A] bg-[#FFF8E6] text-[#17212B] text-xs space-y-1 shadow-2xs">
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#A66A00]">
        <ShieldAlert className="w-3.5 h-3.5 text-[#A66A00]" />
        Official Security Warning & Audit Notice
      </div>
      <p className="text-[11px] leading-relaxed text-[#5B6875] font-medium pl-5">
        Authorized personnel access only. All activities, exhibit views, downloads, and custody transfers are recorded in an append-only audit ledger under statutory compliance.
      </p>
    </div>
  );
};
