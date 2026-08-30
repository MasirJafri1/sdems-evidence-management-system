import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Settings, CheckCircle2 } from 'lucide-react';
import { ENV } from '../../../config/env.config';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'organization' | 'notifications' | 'sessions' | 'system'>('account');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
          <Settings className="w-7 h-7 text-slate-900" />
          Platform System Settings & Security Configuration
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Configure officer account parameters, security keys, agency notifications, and node settings.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          System Settings Updated & Logged to Audit Trail Successfully.
        </div>
      )}

      <div className="flex border-b border-slate-200 bg-slate-50 px-2 rounded-t gap-1">
        {(['account', 'security', 'organization', 'notifications', 'sessions', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === tab ? 'border-slate-900 text-slate-900 bg-white' : 'border-transparent text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <Card title="OFFICER PROFILE SPECIFICATIONS">
          <div className="space-y-3 text-xs max-w-xl">
            <div><label className="font-bold text-slate-700 uppercase">Officer Name</label><input type="text" defaultValue="Senior Inspector Rajesh Sharma" className="w-full p-2 border rounded mt-1 text-slate-900 font-semibold" /></div>
            <div><label className="font-bold text-slate-700 uppercase">Official Email</label><input type="email" defaultValue="r.sharma@cbi.gov.in" disabled className="w-full p-2 bg-slate-100 border rounded mt-1 text-slate-600 font-mono" /></div>
            <div><label className="font-bold text-slate-700 uppercase">Designation</label><input type="text" defaultValue="Lead Cyber Investigator" className="w-full p-2 border rounded mt-1 text-slate-900" /></div>
            <Button variant="primary" onClick={handleSave} className="mt-2">Save Profile Updates</Button>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card title="SECURITY & AUTHENTICATION SETTINGS">
          <div className="space-y-3 text-xs max-w-xl">
            <div className="p-3 bg-slate-50 border rounded flex justify-between items-center">
              <div><div className="font-bold text-slate-900">Two-Factor Security Token (2FA)</div><div className="text-slate-500 text-[11px]">Hardware YubiKey / TOTP Authenticator</div></div>
              <Badge variant="success">ENABLED</Badge>
            </div>
            <div className="p-3 bg-slate-50 border rounded flex justify-between items-center">
              <div><div className="font-bold text-slate-900">JWT Token Expiry</div><div className="text-slate-500 text-[11px]">Strict 8-hour session timeout</div></div>
              <Badge variant="info">8 HOURS</Badge>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'system' && (
        <Card title="SYSTEM INFORMATION & CRYPTOGRAPHIC VERIFICATION">
          <div className="space-y-2 text-xs">
            <div><span className="font-bold text-slate-500">Platform:</span> <span className="text-slate-900 font-bold">{ENV.APP_NAME} ({ENV.FULL_NAME})</span></div>
            <div><span className="font-bold text-slate-500">Tagline:</span> <span className="text-slate-900 italic">"{ENV.TAGLINE}"</span></div>
            <div><span className="font-bold text-slate-500">Blockchain Smart Contract:</span> <span className="font-mono text-slate-900 font-bold">EvidenceRegistry.sol (Hardhat Port 8545)</span></div>
            <div><span className="font-bold text-slate-500">Digest Standard:</span> <span className="font-mono text-slate-900 font-bold">SHA-256 / Keccak-256</span></div>
          </div>
        </Card>
      )}
    </div>
  );
};
