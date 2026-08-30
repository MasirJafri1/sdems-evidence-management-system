import React from 'react';
import { AuthCard } from '../components/AuthCard';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';
import { ENV } from '../../../config/env.config';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useLogin();

  const handleLoginSubmit = (organizationCode: string, email: string, password: string) => {
    login({ organizationCode, email, password, rememberMe: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans border-t-4 border-t-slate-900">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded bg-slate-900 font-black text-white flex items-center justify-center text-xs tracking-wider">
              GOV
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {ENV.APP_NAME}
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-700">{ENV.FULL_NAME}</p>
          <div className="text-[11px] text-slate-500 italic">"{ENV.TAGLINE}"</div>
        </div>

        <AuthCard>
          <LoginForm
            onSubmit={handleLoginSubmit}
            isLoading={isLoading}
            error={error}
          />
        </AuthCard>

        <div className="text-[11px] text-slate-500 font-medium">
          National Digital Evidence & Records Platform • Ministry of Home Affairs Digital Systems
        </div>
      </div>
    </div>
  );
};
