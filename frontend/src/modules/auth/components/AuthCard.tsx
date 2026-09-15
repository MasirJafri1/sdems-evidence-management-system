import React from 'react';
import { Card } from '../../../components/ui/Card';
import { SecurityNotice } from './SecurityNotice';

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <Card className="p-8 max-w-md w-full border border-[#DCE3EA] shadow-sm bg-white rounded-md relative z-20 border-t-4 border-t-[#123B63]">
      <div className="mb-6 pb-4 border-b border-[#DCE3EA]">
        <h2 className="text-xs font-bold text-[#123B63] uppercase tracking-wider">
          Official Officer Authentication Portal
        </h2>
        <p className="text-xs font-medium text-[#5B6875] mt-1 leading-relaxed">
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
