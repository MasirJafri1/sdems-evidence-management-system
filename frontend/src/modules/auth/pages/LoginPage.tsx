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
    <div className="min-h-screen bg-[#F6F8FB] flex font-sans antialiased">
      {/* Left Panel: Government Portal Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#123B63] flex-col justify-between p-12 lg:p-16 border-r border-[#DCE3EA]">
        {/* Subtle decorative grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        {/* Top Emblem Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#123B63] border-2 border-[#B58B4A] font-extrabold text-white flex items-center justify-center text-xs tracking-wider shadow-2xs">
              GOV
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {ENV.APP_NAME}
              </h1>
              <span className="text-[10px] text-[#B58B4A] uppercase font-bold tracking-wider block">
                Official Digital Evidence System
              </span>
            </div>
          </div>
        </div>

        {/* Center Statement */}
        <div className="relative z-10 max-w-lg space-y-4">
          <h2 className="text-3xl leading-tight font-extrabold text-white">
            {ENV.FULL_NAME}
          </h2>
          <p className="text-sm text-slate-200 font-medium leading-relaxed border-l-2 border-[#B58B4A] pl-4">
            "{ENV.TAGLINE}"
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-[11px] font-bold text-slate-300 tracking-wider uppercase">
          National Digital Evidence & Records Platform<br />
          <span className="text-[#B58B4A]">Ministry of Home Affairs Digital Infrastructure</span>
        </div>
      </div>

      {/* Right Panel: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#F6F8FB] relative">
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile-only header */}
          <div className="lg:hidden mb-8 space-y-2 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-md bg-[#123B63] border border-[#B58B4A] font-bold text-white flex items-center justify-center text-xs">
                GOV
              </div>
              <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight">
                {ENV.APP_NAME}
              </h1>
            </div>
            <p className="text-xs font-semibold text-[#5B6875]">{ENV.FULL_NAME}</p>
          </div>

          <AuthCard>
            <LoginForm
              onSubmit={handleLoginSubmit}
              isLoading={isLoading}
              error={error}
            />
          </AuthCard>
        </div>
      </div>
    </div>
  );
};
