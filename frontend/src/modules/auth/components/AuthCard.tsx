import React from 'react';
import { Card } from '../../../components/ui/Card';
import { SecurityNotice } from './SecurityNotice';

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <Card className="p-8 max-w-md w-full border border-white/60 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-2xl relative z-20">
      <div className="mb-6 pb-4 border-b border-slate-200/60">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          Official Officer Authentication
        </h2>
        <p className="text-[13px] font-medium text-slate-500 mt-1 leading-relaxed">
          Enter credentials authorized by your departmental organization
        </p>
      </div>

      <div className="space-y-6">
        {children}
        <SecurityNotice />
      </div>
    </Card>
  );
};
