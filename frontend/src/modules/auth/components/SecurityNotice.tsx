import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const SecurityNotice: React.FC = () => {
  return (
    <div className="p-3.5 rounded border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-1">
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
        Official Security Warning & Audit Notice
      </div>
      <p className="text-[11px] leading-relaxed text-amber-800">
        Authorized access only. All activities, uploads, custody transfers, and record views are securely logged and cryptographically audited under legal compliance.
      </p>
    </div>
  );
};
