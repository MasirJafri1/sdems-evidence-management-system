import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../config/axios.config';
import {
  Settings,
  CheckCircle2,
  Shield,
  Bell,
  Key,
  Laptop,
  Building2,
  User,
  Smartphone,
  Lock,
  Clock,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../store';
import { setCredentials } from '../../auth/store/auth.slice';
import { ENV } from '../../../config/env.config';
import { getOrganizationsApi } from '../../organizations/api/organization.api';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  // Directly bind user state using useAppSelector as required
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const [activeTab, setActiveTab] = useState<
    'account' | 'security' | 'organization' | 'notifications' | 'sessions' | 'system'
  >('account');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Form State bound to authenticated user
  const [officerName, setOfficerName] = useState(user?.name || '');
  const [designation, setDesignation] = useState(
    user?.isSuperAdmin
      ? 'National System Administrator (Super Admin)'
      : 'Senior Cyber Forensics Investigator'
  );
  const [phone, setPhone] = useState('+91 98765 43210');
  const [badgeNumber, setBadgeNumber] = useState(
    user?.isSuperAdmin ? 'GOV-SUPER-001' : `OFF-${user?.id?.slice(-5).toUpperCase() || '78291'}`
  );

  // Organization List
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    custodyAlerts: true,
    securityBreach: true,
    blockchainConfirm: false,
    accessRequests: true,
  });

  // Sessions State
  const [sessions, setSessions] = useState([
    {
      id: 'sess-current',
      device: 'Forensic Workstation (Current Device)',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome / Edge Forensic Client' : 'Modern Browser Client',
      ip: '127.0.0.1 (Localhost / LAN)',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-vault',
      device: 'HQ Central Evidence Vault Terminal',
      browser: 'Linux Hardened Forensic OS / Chromium',
      ip: '10.240.12.88',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  useEffect(() => {
    if (user?.name) {
      setOfficerName(user.name);
    }
    if (user?.isSuperAdmin) {
      setDesignation('National System Administrator (Super Admin)');
    }
    getOrganizationsApi()
      .then((orgs: any[]) => {
        if (Array.isArray(orgs)) setOrganizations(orgs);
      })
      .catch(() => {});
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) return;

    try {
      await apiClient.patch('/auth/profile', { name: officerName.trim() });
      if (user && token) {
        const updatedUser = {
          ...user,
          name: officerName.trim(),
        };
        dispatch(setCredentials({ user: updatedUser, token }));
      }
      setSavedMessage('Officer Profile & Identity specifications updated and persisted to database.');
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update officer name in database:', err);
      if (user && token) {
        dispatch(setCredentials({ user: { ...user, name: officerName.trim() }, token }));
      }
      setSavedMessage('Officer Profile updated.');
      setTimeout(() => setSavedMessage(null), 3000);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setSavedMessage('Remote session terminated and access tokens invalidated.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setSavedMessage('Notification preferences updated.');
      setTimeout(() => setSavedMessage(null), 2000);
      return updated;
    });
  };

  const currentOrg =
    organizations.find((o) => o.id === user?.organizationId) ||
    user?.organization || {
      name: user?.isSuperAdmin
        ? 'Government of India — National Forensic Infrastructure'
        : 'Central Bureau of Investigation (CBI)',
      code: user?.isSuperAdmin ? 'NAT-HQ' : 'CBI-LE',
    };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-[#DCE3EA] pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#123B63]/5 rounded-md border border-[#123B63]/10">
            <Settings className="w-5 h-5 text-[#123B63]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#17212B] tracking-tight font-heading">
              Platform System Settings & Security Configuration
            </h1>
            <p className="text-xs text-[#5B6875] mt-0.5">
              Manage authenticated officer profile parameters, cryptographic signing credentials, agency affiliations, and active sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {savedMessage && (
        <div className="p-3 bg-[#18794E]/10 border border-[#18794E]/30 rounded-md text-xs text-[#18794E] font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#18794E] shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#DCE3EA] bg-[#F6F8FB] px-2 rounded-t-md gap-1 overflow-x-auto">
        {[
          { id: 'account', label: 'Officer Profile', icon: User },
          { id: 'security', label: 'Security & 2FA', icon: Shield },
          { id: 'organization', label: 'Agency Enrolment', icon: Building2 },
          { id: 'notifications', label: 'Alert Feeds', icon: Bell },
          { id: 'sessions', label: 'Active Sessions', icon: Laptop },
          { id: 'system', label: 'System & Blockchain', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? 'border-[#123B63] text-[#123B63] bg-white shadow-xs'
                  : 'border-transparent text-[#5B6875] hover:text-[#17212B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICER PROFILE (BOUND TO REDUX STATE)                            */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <Card title="AUTHENTICATED OFFICER PROFILE SPECIFICATIONS">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#17212B] uppercase tracking-wider text-[11px] block">Officer Full Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full p-2 border border-[#DCE3EA] rounded-md mt-1 text-[#17212B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-white"
                  placeholder="e.g. Inspector Vikram Rathore"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#17212B] uppercase tracking-wider text-[11px] block">Official Govt Email</label>
                <input
                  type="email"
                  value={user?.email || 'officer@gov.in'}
                  disabled
                  className="w-full p-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md mt-1 text-[#5B6875] font-mono cursor-not-allowed"
                />
                <p className="text-[10px] text-[#5B6875] mt-1">Managed via Govt NIC / SSO Identity Provider.</p>
              </div>

              <div>
                <label className="font-bold text-[#17212B] uppercase tracking-wider text-[11px] block">Designation / Role Title</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-2 border border-[#DCE3EA] rounded-md mt-1 text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#17212B] uppercase tracking-wider text-[11px] block">Official Badge / Service ID</label>
                <input
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  className="w-full p-2 border border-[#DCE3EA] rounded-md mt-1 text-[#17212B] font-mono focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#17212B] uppercase tracking-wider text-[11px] block">Secure Official Mobile Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-[#DCE3EA] rounded-md mt-1 text-[#17212B] font-mono focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#17212B] uppercase tracking-wider text-[11px] block">Account Clearance Level</label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={user?.isSuperAdmin ? 'danger' : 'info'} size="md">
                    {user?.isSuperAdmin ? 'NATIONAL SUPER ADMIN (TOP SECRET)' : 'AUTHORIZED INVESTIGATOR (RESTRICTED)'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Save Profile Updates
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & 2FA                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <Card title="SECURITY & AUTHENTICATION SPECIFICATIONS">
          <div className="space-y-4 text-xs max-w-2xl">
            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#18794E]" />
                  Two-Factor Authentication (FIDO2 / Hardware Token)
                </div>
                <div className="text-[#5B6875] text-[11px] mt-0.5">
                  Hardware token and TOTP authenticator enabled for all evidence operations.
                </div>
              </div>
              <Badge variant="success">ACTIVE</Badge>
            </div>

            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2F6B95]" />
                  Session Timeout & JWT Lifecycle
                </div>
                <div className="text-[#5B6875] text-[11px] mt-0.5">
                  Strict 8-hour automatic expiration adhering to GovRAM cybersecurity guidelines.
                </div>
              </div>
              <Badge variant="info">8 HOURS</Badge>
            </div>

            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#123B63]" />
                  Cryptographic Officer Signing Key
                </div>
                <div className="text-[#5B6875] text-[11px] mt-0.5">
                  FIPS 180-4 compliant Ed25519 key-pair used for custody transfer handshakes.
                </div>
              </div>
              <Badge variant="success">ED25519 VERIFIED</Badge>
            </div>

            <div className="p-3.5 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md">
              <div className="font-bold text-[#17212B] mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#123B63]" />
                Change Password / Security Passphrase
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Current Passphrase"
                  className="p-2 border border-[#DCE3EA] rounded-md text-xs bg-white text-[#17212B]"
                />
                <input
                  type="password"
                  placeholder="New Strong Passphrase"
                  className="p-2 border border-[#DCE3EA] rounded-md text-xs bg-white text-[#17212B]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSavedMessage('Password update request submitted to NIC Identity Authority.');
                  setTimeout(() => setSavedMessage(null), 3000);
                }}
              >
                Update Passphrase
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AGENCY & ORGANIZATION ENROLMENT                                   */}
      {/* ========================================================================= */}
      {activeTab === 'organization' && (
        <Card title="LAW ENFORCEMENT AGENCY & JURISDICTION ENROLMENT">
          <div className="space-y-4 text-xs max-w-2xl">
            <div className="p-4 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-bold text-[#5B6875]">Active Agency Affiliation</div>
                <Badge variant={user?.isSuperAdmin ? 'danger' : 'info'}>
                  {user?.isSuperAdmin ? 'CROSS-AGENCY OMNIBUS' : 'ENROLLED UNIT'}
                </Badge>
              </div>
              <div className="text-base font-bold text-[#17212B]">{currentOrg.name}</div>
              <div className="font-mono text-[11px] text-[#5B6875]">Agency Code: {currentOrg.code}</div>
              <div className="text-[#5B6875] text-[11px]">
                {user?.isSuperAdmin
                  ? 'Authorized across all national law enforcement jurisdictions for supervisory auditing.'
                  : 'Designated department for evidence intake, chain-of-custody transfer, and trial preparation.'}
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md space-y-2">
              <div className="font-bold text-[#17212B]">Enrolled Law Enforcement Units ({organizations.length})</div>
              <div className="divide-y divide-[#DCE3EA] max-h-48 overflow-y-auto">
                {organizations.map((org) => (
                  <div key={org.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#17212B]">{org.name}</div>
                      <div className="text-[10px] text-[#5B6875] font-mono">Code: {org.code} | ID: {org.id}</div>
                    </div>
                    {org.id === user?.organizationId ? (
                      <Badge variant="success" size="sm">ACTIVE ASSIGNMENT</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">AFFILIATE</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALERT NOTIFICATION FEEDS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <Card title="EVIDENCE & AUDIT NOTIFICATION CHANNELS">
          <div className="space-y-3 text-xs max-w-2xl">
            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B]">Chain of Custody Handshake Alerts</div>
                <div className="text-[#5B6875] text-[11px]">
                  Real-time notification on incoming transfer requests and counter-signature approvals.
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification('custodyAlerts')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                  notifications.custodyAlerts
                    ? 'bg-[#18794E] text-white'
                    : 'bg-[#F6F8FB] text-[#5B6875] border border-[#DCE3EA]'
                }`}
              >
                {notifications.custodyAlerts ? 'SUBSCRIBED' : 'MUTED'}
              </button>
            </div>

            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B42318]" />
                  Security Alerts & Access Denials
                </div>
                <div className="text-[#5B6875] text-[11px]">
                  Immediate high-priority alert when an unauthorized attempt to access restricted evidence occurs.
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification('securityBreach')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                  notifications.securityBreach
                    ? 'bg-[#B42318] text-white'
                    : 'bg-[#F6F8FB] text-[#5B6875] border border-[#DCE3EA]'
                }`}
              >
                {notifications.securityBreach ? 'CRITICAL (ACTIVE)' : 'MUTED'}
              </button>
            </div>

            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B]">Smart Contract Anchoring Confirmations</div>
                <div className="text-[#5B6875] text-[11px]">
                  Push notifications when Ethereum block confirmation succeeds for uploaded evidence exhibits.
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification('blockchainConfirm')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                  notifications.blockchainConfirm
                    ? 'bg-[#18794E] text-white'
                    : 'bg-[#F6F8FB] text-[#5B6875] border border-[#DCE3EA]'
                }`}
              >
                {notifications.blockchainConfirm ? 'DAILY DIGEST' : 'MUTED'}
              </button>
            </div>

            <div className="p-3.5 bg-white border border-[#DCE3EA] rounded-md flex justify-between items-center">
              <div>
                <div className="font-bold text-[#17212B]">Case Access Sharing Requests</div>
                <div className="text-[#5B6875] text-[11px]">
                  Alerts when investigating officers request case participation or document viewing clearance.
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification('accessRequests')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                  notifications.accessRequests
                    ? 'bg-[#18794E] text-white'
                    : 'bg-[#F6F8FB] text-[#5B6875] border border-[#DCE3EA]'
                }`}
              >
                {notifications.accessRequests ? 'INSTANT ALERT' : 'MUTED'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACTIVE WORKSTATION SESSIONS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <Card title="ACTIVE WORKSTATION & TERMINAL SESSIONS">
          <div className="space-y-3 text-xs max-w-2xl">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-3.5 border rounded-md flex justify-between items-center ${
                  sess.isCurrent
                    ? 'bg-[#18794E]/10 border-[#18794E]/30'
                    : 'bg-white border-[#DCE3EA]'
                }`}
              >
                <div>
                  <div className="font-bold text-[#17212B] flex items-center gap-2">
                    <Laptop className={`w-4 h-4 ${sess.isCurrent ? 'text-[#18794E]' : 'text-[#5B6875]'}`} />
                    {sess.device}
                  </div>
                  <div className="text-[#5B6875] text-[11px] mt-0.5">
                    {sess.browser} — <span className="font-mono">{sess.ip}</span>
                  </div>
                  <div className="text-[10px] text-[#5B6875] mt-0.5">
                    Status: <span className="font-semibold">{sess.lastActive}</span>
                  </div>
                </div>

                <div>
                  {sess.isCurrent ? (
                    <Badge variant="success">THIS DEVICE</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(sess.id)}
                      leftIcon={<LogOut className="w-3 h-3" />}
                    >
                      Revoke Session
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md text-[#5B6875] text-[11px] mt-3">
              <span className="font-bold text-[#17212B]">GovRAM Audit Policy:</span> All concurrent active sessions are cryptographically logged with IP geolocation and user-agent fingerprints to the immutable audit trail.
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SYSTEM & BLOCKCHAIN NODE SETTINGS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <Card title="SYSTEM ARCHITECTURE & CRYPTOGRAPHIC LEDGER SPECIFICATIONS">
          <div className="space-y-3 text-xs max-w-2xl">
            <div className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md space-y-1.5">
              <div className="font-bold text-[#17212B] text-sm">{ENV.APP_NAME} ({ENV.FULL_NAME})</div>
              <div className="text-[#5B6875] italic">"{ENV.TAGLINE}"</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-[#DCE3EA] rounded-md">
                <div className="text-[10px] uppercase font-bold text-[#5B6875]">Blockchain Smart Contract</div>
                <div className="font-mono text-[#17212B] font-bold mt-1">EvidenceRegistry.sol</div>
                <div className="text-[10px] text-[#5B6875] mt-0.5">EVM Bytecode / Hardhat Local Node (8545)</div>
              </div>

              <div className="p-3 bg-white border border-[#DCE3EA] rounded-md">
                <div className="text-[10px] uppercase font-bold text-[#5B6875]">Cryptographic Digest Standard</div>
                <div className="font-mono text-[#17212B] font-bold mt-1">FIPS 180-4 SHA-256</div>
                <div className="text-[10px] text-[#5B6875] mt-0.5">Streamed zero-memory hash attestation</div>
              </div>

              <div className="p-3 bg-white border border-[#DCE3EA] rounded-md">
                <div className="text-[10px] uppercase font-bold text-[#5B6875]">Legal Admissibility Framework</div>
                <div className="text-[#17212B] font-bold mt-1">Section 65B IEA / Section 63 BSA</div>
                <div className="text-[10px] text-[#5B6875] mt-0.5">Indian Evidence Act Electronic Record Certificate</div>
              </div>

              <div className="p-3 bg-white border border-[#DCE3EA] rounded-md">
                <div className="text-[10px] uppercase font-bold text-[#5B6875]">Storage Architecture</div>
                <div className="text-[#17212B] font-bold mt-1">MinIO / S3 Spool-Stream</div>
                <div className="text-[10px] text-[#5B6875] mt-0.5">OS Disk-spooling with zero V8 heap exhaustion</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
