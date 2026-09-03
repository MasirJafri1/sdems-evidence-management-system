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
    <div className="min-h-screen bg-white flex font-sans antialiased">
      
      {/* Left Panel: Branding & Impact (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Background gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/90 mix-blend-multiply pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        {/* Top Header */}
        <div className="relative z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-black text-slate-900 flex items-center justify-center text-sm tracking-wider shadow-lg shadow-amber-500/20">
              GOV
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight font-heading">
              {ENV.APP_NAME}
            </h1>
          </div>
        </div>

        {/* Center Impact Statement */}
        <div className="relative z-10 max-w-lg space-y-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <h2 className="text-4xl leading-tight font-extrabold text-white">
            {ENV.FULL_NAME}
          </h2>
          <p className="text-lg text-slate-300 font-medium leading-relaxed border-l-2 border-amber-500 pl-4">
            "{ENV.TAGLINE}"
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-xs font-semibold text-slate-400 tracking-wider uppercase animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          National Digital Evidence & Records Platform<br />
          <span className="text-amber-500/80">Ministry of Home Affairs Digital Systems</span>
        </div>
      </div>

      {/* Right Panel: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 relative overflow-hidden">
        {/* Subtle background decoration for the form side */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          {/* Mobile-only header (shows when left panel is hidden) */}
          <div className="lg:hidden mb-8 space-y-2 text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-slate-900 font-black text-white flex items-center justify-center text-xs tracking-wider">
                GOV
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {ENV.APP_NAME}
              </h1>
            </div>
            <p className="text-sm font-semibold text-slate-700">{ENV.FULL_NAME}</p>
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
