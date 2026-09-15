import React, { useState } from 'react';
import { Building, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface LoginFormProps {
  onSubmit: (orgCode: string, email: string, pass: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
}) => {
  const [orgCode, setOrgCode] = useState('GOV-SUPERADMIN');
  const [email, setEmail] = useState('superadmin@gov.in');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(orgCode, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Organization Code"
        placeholder="e.g. CBI-001"
        leftIcon={<Building className="w-4 h-4" />}
        value={orgCode}
        onChange={(e) => setOrgCode(e.target.value)}
        required
      />

      <Input
        label="Official Email Address"
        type="email"
        placeholder="officer@agency.gov.in"
        leftIcon={<Mail className="w-4 h-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Account Password"
        type="password"
        placeholder="••••••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="flex items-center justify-between text-xs text-slate-600">
        <label className="flex items-center gap-2 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          Remember this device
        </label>
        <button type="button" className="text-slate-700 hover:underline font-semibold">
          Forgot Password?
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Sign In to Portal
      </Button>

      {/* Quick Demo Login Shortcuts */}
      <div className="pt-3 border-t border-[#DCE3EA] space-y-2">
        <span className="text-[10px] font-bold text-[#5B6875] uppercase tracking-wider block">
          ⚡ Quick Demo Login Credentials
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setOrgCode('GOV-SUPERADMIN');
              setEmail('superadmin@gov.in');
              setPassword('Password123!');
            }}
            className="p-2 border border-[#DCE3EA] bg-[#F6F8FB] hover:bg-[#EBF3FA] rounded-md text-left transition-colors cursor-pointer"
          >
            <div className="font-bold text-[#123B63]">🛡️ Super Admin</div>
            <div className="text-[10px] text-[#5B6875] font-mono">GOV-SUPERADMIN</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrgCode('CBI-001');
              setEmail('admin@cbi.gov.in');
              setPassword('Password123!');
            }}
            className="p-2 border border-[#DCE3EA] bg-[#F6F8FB] hover:bg-[#EBF3FA] rounded-md text-left transition-colors cursor-pointer"
          >
            <div className="font-bold text-[#123B63]">🏢 CBI Org Admin</div>
            <div className="text-[10px] text-[#5B6875] font-mono">CBI-001</div>
          </button>
        </div>
      </div>
    </form>
  );
};
