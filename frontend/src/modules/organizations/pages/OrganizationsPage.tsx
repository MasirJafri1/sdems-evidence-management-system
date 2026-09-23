import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { CardSkeleton } from '../../../components/ui/TableSkeleton';
import { Building, ShieldCheck, Plus, Users, CheckCircle, AlertCircle, UserCheck, Search } from 'lucide-react';
import {
  createOrganizationApi,
  getOrganizationsApi,
  lookupUserApi,
  getSuperAdminAllDataApi,
} from '../api/organization.api';

interface OrgMember {
  id: string;
  name: string;
  badgeNumber: string;
  role: string;
  department: string;
  status: 'ACTIVE' | 'ON_LEAVE';
}

interface Organization {
  id: string;
  name: string;
  code: string;
  members: OrgMember[];
  casesCount: number;
  securityLevel: string;
}

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.isSuperAdmin || user?.email?.trim().toLowerCase() === 'superadmin@gov.in';

  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for Organization Bootstrap
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  
  // Compulsory Admin Assignment state: 'NEW' | 'EXISTING'
  const [adminType, setAdminType] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingUserId, setExistingUserId] = useState('');
  const [adminLookupQuery, setAdminLookupQuery] = useState('');
  const [searchedAdmin, setSearchedAdmin] = useState<any | null>(null);
  const [isSearchingAdmin, setIsSearchingAdmin] = useState(false);
  const [adminLookupError, setAdminLookupError] = useState<string | null>(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);
  
  // New Admin details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Password123!');

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin) {
        const superData = await getSuperAdminAllDataApi();
        if (superData && superData.success) {
          if (Array.isArray(superData.users)) {
            setAllRegisteredUsers(superData.users);
          }
          if (Array.isArray(superData.organizations)) {
            const mapped: Organization[] = superData.organizations.map((o: any) => ({
              id: o.id,
              name: o.name,
              code: o.code,
              casesCount: o._count?.cases || 0,
              securityLevel: 'LEVEL 4 ZERO-TRUST',
              members: (o.memberships || []).map((m: any) => ({
                id: m.user?.id || m.id,
                name: m.user?.name || 'Officer',
                badgeNumber: `${o.code}-ADMIN-01`,
                role: m.role?.name || 'Organization Admin',
                department: 'Executive Governance',
                status: m.status || 'ACTIVE'
              }))
            }));
            setOrganizations(mapped);
            if (mapped.length > 0 && !selectedOrgId) {
              setSelectedOrgId(mapped[0].id);
            }
            return;
          }
        }
      }

      const orgs = await getOrganizationsApi();

      if (Array.isArray(orgs)) {
        const mapped: Organization[] = orgs.map((o: any) => ({
          id: o.id,
          name: o.name,
          code: o.code,
          casesCount: o._count?.cases || 0,
          securityLevel: 'LEVEL 4 ZERO-TRUST',
          members: (o.memberships || []).map((m: any) => ({
            id: m.user?.id || m.id,
            name: m.user?.name || 'Officer',
            badgeNumber: `${o.code}-ADMIN-01`,
            role: m.role?.name || 'Organization Admin',
            department: 'Executive Governance',
            status: m.status || 'ACTIVE'
          }))
        }));
        setOrganizations(mapped);
        if (mapped.length > 0 && !selectedOrgId) {
          setSelectedOrgId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load organization data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isSuperAdmin]);

  const handleAdminLookup = async () => {
    if (!adminLookupQuery.trim()) {
      setAdminLookupError('Please enter an Email address or User ID to lookup.');
      return;
    }

    setIsSearchingAdmin(true);
    setAdminLookupError(null);
    setSearchedAdmin(null);
    setExistingUserId('');

    const res = await lookupUserApi(adminLookupQuery.trim());
    setIsSearchingAdmin(false);

    if (res.found && res.user) {
      setSearchedAdmin(res.user);
      setExistingUserId(res.user.id);
    } else {
      setAdminLookupError(res.message || 'No registered officer found with that Email or User ID.');
    }
  };

  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (adminType === 'EXISTING' && !existingUserId) {
      setErrorMessage('Compulsory: Please lookup and verify a registered officer as Organization Admin by Email or User ID.');
      setIsSubmitting(false);
      return;
    }

    if (adminType === 'NEW' && (!adminName || !adminEmail || !adminPassword)) {
      setErrorMessage('Compulsory: Please fill all fields to create a new Organization Admin account.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = adminType === 'EXISTING' ? {
        name: newOrgName,
        code: newOrgCode.toUpperCase(),
        adminType: 'EXISTING' as const,
        existingUserId
      } : {
        name: newOrgName,
        code: newOrgCode.toUpperCase(),
        adminType: 'NEW' as const,
        adminName,
        adminEmail,
        adminPassword
      };

      const result = await createOrganizationApi(payload);

      const assignedAdminName = adminType === 'EXISTING' ? (searchedAdmin?.name || 'Assigned Officer') : adminName;
      const assignedAdminEmail = adminType === 'EXISTING' ? (searchedAdmin?.email || 'officer@gov.in') : adminEmail;

      await loadData();
      if (result?.organization?.id) {
        setSelectedOrgId(result.organization.id);
      }

      if (adminType === 'NEW') {
        setSuccessMessage(`✅ Organization "${newOrgName}" created! Admin User Created: ${assignedAdminEmail} | Password: ${adminPassword}`);
      } else {
        setSuccessMessage(`✅ Organization "${newOrgName}" created! Admin Role assigned to existing officer: ${assignedAdminName} (${assignedAdminEmail})`);
      }

      // Reset form
      setNewOrgName('');
      setNewOrgCode('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('Password123!');
      setExistingUserId('');
      setAdminLookupQuery('');
      setSearchedAdmin(null);
      setIsAddOrgOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to register organization. Please check details and try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelectedOrg = organizations.find((o) => o.id === selectedOrgId) || organizations[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#123B63]/5 rounded-md border border-[#123B63]/10">
              <Building className="w-5 h-5 text-[#123B63]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#17212B] tracking-tight font-heading">
                Multi-Tenant Organization Portal
              </h1>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Register government agencies, manage enrolled personnel rosters, and assign organization administrator authority.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/users')}
            leftIcon={<Users className="w-4 h-4 text-[#2F6B95]" />}
          >
            Manage Roster (User Tab)
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddOrgOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Organization
          </Button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="flex items-start gap-2 p-3 bg-[#18794E]/10 border border-[#18794E]/30 rounded-md text-xs text-[#18794E] font-medium">
          <CheckCircle className="w-4 h-4 text-[#18794E] shrink-0 mt-0.5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-[#18794E] hover:opacity-80 font-bold">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-[#B42318]/10 border border-[#B42318]/30 rounded-md text-xs text-[#B42318] font-medium">
          <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-[#B42318] hover:opacity-80 font-bold">✕</button>
        </div>
      )}

      {/* Organization Cards */}
      {isLoading ? (
        <CardSkeleton count={3} />
      ) : organizations.length === 0 ? (
        <div className="p-8 border border-dashed border-[#DCE3EA] bg-white rounded-md text-center space-y-3">
          <Building className="w-10 h-10 text-[#5B6875] mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-[#17212B]">No Enrolled Organizations</h3>
            <p className="text-xs text-[#5B6875] max-w-sm mx-auto mt-1">
              You are currently viewing organizations for your enrolled account. Click "Register Organization" above to provision a new agency.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {organizations.map((o) => (
            <Card
              key={o.id}
              title={o.name}
              subtitle={`Agency Code: ${o.code}`}
            >
              <div className="space-y-3 text-xs pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6875] font-medium">Enrolled Personnel:</span>
                  <span className="font-bold text-[#17212B]">{o.members.length} Officers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6875] font-medium">Active Containers:</span>
                  <span className="font-bold text-[#17212B]">{o.casesCount} Cases</span>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-[#DCE3EA]">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="w-3 h-3 inline mr-1" />
                      {o.securityLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant={selectedOrgId === o.id ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedOrgId(o.id)}
                    >
                      {selectedOrgId === o.id ? 'Viewing Roster' : 'Select Roster'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/cases?orgId=${o.id}`)}
                      className="border-[#DCE3EA] text-[#2F6B95] hover:bg-[#F6F8FB]"
                    >
                      View Cases
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Personnel Roster Details */}
      {currentSelectedOrg && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#17212B] font-heading flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2F6B95]" />
                Personnel Roster for {currentSelectedOrg.name}
              </h2>
              <p className="text-[11px] text-[#5B6875]">
                Showing assigned personnel and organization administrator credentials.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/users')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Users (In User Tab)
            </Button>
          </div>

          <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#123B63] font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Officer Name & Badge</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Department / Division</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
                {currentSelectedOrg.members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-[#5B6875] italic">
                      No personnel assigned yet. Go to the Users tab to add new officers.
                    </td>
                  </tr>
                ) : (
                  currentSelectedOrg.members.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F6F8FB]">
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-[#17212B]">{m.name}</div>
                        <div className="font-mono text-[11px] text-[#5B6875]">{m.badgeNumber}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="neutral" size="sm">
                          {m.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-[#5B6875]">{m.department}</td>
                      <td className="p-3">
                        <Badge variant="success" size="sm">
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Register & Bootstrap Organization */}
      <Modal
        isOpen={isAddOrgOpen}
        onClose={() => setIsAddOrgOpen(false)}
        title="Register Organization & Assign Compulsory Org Admin"
        maxWidth="md"
      >
        <form onSubmit={handleRegisterOrg} className="space-y-4 text-xs">
          <div className="p-3 bg-[#EBF3FA] border border-[#2F6B95]/30 rounded-md text-[#123B63] text-[11px]">
            <strong>Compulsory Admin Assignment:</strong> Every new organization must be assigned an Organization Admin. You can either lookup an existing registered officer by Email/ID or create a new user on the go.
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="flex items-center gap-2 p-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md">
            <span className="text-[10px] font-bold text-[#5B6875] uppercase tracking-wider">⚡ Quick Demo Presets:</span>
            <button
              type="button"
              onClick={() => {
                setNewOrgName('Central Bureau of Investigation');
                setNewOrgCode('CBI-HQ');
                setAdminType('NEW');
                setAdminName('Inspector Vikram Rathore');
                setAdminEmail('investigator@cbi.gov.in');
                setAdminPassword('Investigator@123');
              }}
              className="px-2 py-1 bg-white hover:bg-[#EBF3FA] border border-[#2F6B95]/40 text-[#123B63] rounded font-bold text-xs transition-colors cursor-pointer"
            >
              🏢 Fill CBI-HQ
            </button>
            <button
              type="button"
              onClick={() => {
                setNewOrgName('Central Forensic Science Laboratory');
                setNewOrgCode('CFSL-DELHI');
                setAdminType('NEW');
                setAdminName('Dr. Ananya Sharma');
                setAdminEmail('lab@cfsl.gov.in');
                setAdminPassword('LabUser@123');
              }}
              className="px-2 py-1 bg-white hover:bg-[#EBF3FA] border border-[#2F6B95]/40 text-[#123B63] rounded font-bold text-xs transition-colors cursor-pointer"
            >
              🔬 Fill CFSL-DELHI
            </button>
          </div>

          <Input
            label="Organization Name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="e.g. Central Bureau of Investigation"
            required
          />

          <Input
            label="Agency Code / Short Identifier"
            value={newOrgCode}
            onChange={(e) => setNewOrgCode(e.target.value)}
            placeholder="e.g. CBI-001"
            required
          />

          {/* Compulsory Admin Selection Mode Toggles */}
          <div className="pt-2 border-t border-[#DCE3EA] space-y-3">
            <label className="block text-xs font-bold text-[#17212B] uppercase tracking-wider">
              Compulsory Organization Admin Assignment <span className="text-[#B42318]">*</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdminType('NEW')}
                className={`p-3 text-left rounded-md border transition-colors ${
                  adminType === 'NEW'
                    ? 'border-[#123B63] bg-[#EBF3FA] text-[#123B63] font-bold'
                    : 'border-[#DCE3EA] bg-white text-[#17212B] hover:bg-[#F6F8FB]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <UserCheck className="w-4 h-4 text-[#123B63]" />
                  Create New User
                </div>
                <div className="text-[10px] text-[#5B6875] mt-1">
                  Provision new login credentials on the go
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdminType('EXISTING')}
                className={`p-3 text-left rounded-md border transition-colors ${
                  adminType === 'EXISTING'
                    ? 'border-[#123B63] bg-[#EBF3FA] text-[#123B63] font-bold'
                    : 'border-[#DCE3EA] bg-white text-[#17212B] hover:bg-[#F6F8FB]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Users className="w-4 h-4 text-[#123B63]" />
                  Assign Registered Officer (Search by Email/ID)
                </div>
                <div className="text-[10px] text-[#5B6875] mt-1">
                  Lookup registered officer by Email or User ID
                </div>
              </button>
            </div>

            {/* Mode A: Select Existing Registered Officer */}
            {adminType === 'EXISTING' ? (
              <div className="space-y-3 pt-2">
                {allRegisteredUsers.length > 0 && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#17212B] uppercase flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#2F6B95]" />
                      Select from System Registered Officers ({allRegisteredUsers.length})
                    </label>
                    <select
                      value={existingUserId}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setExistingUserId(uid);
                        const target = allRegisteredUsers.find((u) => u.id === uid);
                        if (target) {
                          setSearchedAdmin(target);
                          setAdminLookupQuery(target.email);
                          setAdminLookupError(null);
                        } else {
                          setSearchedAdmin(null);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs font-semibold text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63]"
                    >
                      <option value="">-- Choose Registered Officer to assign as Org Admin --</option>
                      {allRegisteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) — {u.isUnassigned ? '⚡ Standalone / Unassigned' : u.organizationNames || 'Enrolled'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 border-t border-[#DCE3EA]"></div>
                  <span className="text-[10px] uppercase font-bold text-[#5B6875]">Or Search by Email / ID</span>
                  <div className="flex-1 border-t border-[#DCE3EA]"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. anil.kumar@cbi.gov.in or cm123..."
                    value={adminLookupQuery}
                    onChange={(e) => setAdminLookupQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdminLookup();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63]"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAdminLookup}
                    isLoading={isSearchingAdmin}
                    leftIcon={<Search className="w-3.5 h-3.5" />}
                  >
                    Lookup
                  </Button>
                </div>

                {searchedAdmin && (
                  <div className="p-3 bg-[#18794E]/10 border border-[#18794E]/30 rounded-md space-y-1 text-xs text-[#18794E] font-medium">
                    <div className="font-bold flex items-center gap-1.5 text-[#18794E]">
                      <CheckCircle className="w-4 h-4 text-[#18794E] shrink-0" />
                      Admin Officer Selected: {searchedAdmin.name} ({searchedAdmin.email})
                    </div>
                    <div className="text-[11px] text-[#18794E]/80 font-mono">
                      User ID: {searchedAdmin.id}
                    </div>
                  </div>
                )}

                {adminLookupError && (
                  <div className="p-3 bg-[#B42318]/10 border border-[#B42318]/30 rounded-md text-xs text-[#B42318] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />
                    <span>{adminLookupError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Mode B: Create New Admin User on the Go */
              <div className="space-y-3 pt-2">
                <Input
                  label="Admin Officer Full Name *"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Inspector General Vikram Rathore"
                  required
                />
                <Input
                  label="Admin Login Email *"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@agency.gov.in"
                  required
                />
                <Input
                  label="Temporary Password *"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <p className="text-[11px] text-[#5B6875]">
                  This user will be registered in the system and can log in at the portal with these credentials.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
            <Button type="button" variant="outline" onClick={() => setIsAddOrgOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Building className="w-4 h-4" />}>
              Register & Assign Admin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
