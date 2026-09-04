import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs space-y-1.5 shadow-inner">
      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-amber-600">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        Official Security Warning & Audit Notice
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500 font-medium pl-6">
        Authorized access only. All activities, uploads, custody transfers, and record views are securely logged and cryptographically audited under legal compliance.
      </p>
    </div>
  );
};
