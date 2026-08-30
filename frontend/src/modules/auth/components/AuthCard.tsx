import React from 'react';
import { Card } from '../../../components/ui/Card';
import { SecurityNotice } from './SecurityNotice';

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <Card className="p-7 max-w-md w-full border-slate-300 shadow-md bg-white">
      <div className="mb-5 pb-3 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Official Officer Authentication
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter credentials authorized by your departmental organization
        </p>
      </div>

      <div className="space-y-5">
        {children}
        <SecurityNotice />
      </div>
    </Card>
  );
};
