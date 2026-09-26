import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store';
import {
  getOrganizationUsersApi,
  getOrganizationsApi,
  createUserApi,
  createStandaloneUserApi,
  lookupUserApi,
  getSuperAdminAllDataApi,
} from '../../organizations/api/organization.api';

import { PermissionMatrix } from '../components/PermissionMatrix';
import { INITIAL_PERMISSIONS, type MockUser } from '../../../mock/users.mock';
import { Users, Building, ShieldCheck, Mail, UserPlus, CheckCircle, AlertCircle, Search, Key } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';

const ORG_PERMISSIONS_LIST = [
  { name: 'CASE_CREATE', label: 'Create Case Containers', category: 'Cases' },
  { name: 'CASE_READ', label: 'Read Case Records (Org-Wide: Read all cases)', category: 'Cases' },
  { name: 'CASE_UPDATE', label: 'Update Case Metadata', category: 'Cases' },
  { name: 'CASE_PARTICIPANT_MANAGE', label: 'Manage Case Participants', category: 'Cases' },

  { name: 'DOCUMENT_UPLOAD', label: 'Upload Evidence Documents', category: 'Documents' },
  { name: 'DOCUMENT_READ', label: 'Read Document Exhibits', category: 'Documents' },
  { name: 'DOCUMENT_UPDATE', label: 'Update Document Versions', category: 'Documents' },
  { name: 'DOCUMENT_DOWNLOAD', label: 'Download Raw Documents', category: 'Documents' },
  { name: 'DOCUMENT_VERIFY', label: 'Verify Cryptographic Hashes', category: 'Documents' },

  { name: 'EVIDENCE_CREATE', label: 'Register Physical Evidence', category: 'Evidence' },
  { name: 'EVIDENCE_READ', label: 'Inspect Physical Evidence', category: 'Evidence' },
  { name: 'EVIDENCE_UPDATE', label: 'Update Physical Evidence', category: 'Evidence' },
  { name: 'CUSTODY_TRANSFER', label: 'Initiate Custody Transfer', category: 'Evidence' },
  { name: 'CUSTODY_ACCEPT', label: 'Accept Custody Handshake', category: 'Evidence' },
  { name: 'CUSTODY_REJECT', label: 'Reject Custody Transfer', category: 'Evidence' },
  { name: 'CUSTODY_HISTORY_READ', label: 'Read Custody Ledger', category: 'Evidence' },

  { name: 'AUDIT_READ', label: 'Inspect Audit Logs', category: 'Governance' },
  { name: 'USER_CREATE', label: 'Provision / Enroll Users', category: 'Governance' },
  { name: 'USER_READ', label: 'View Personnel Roster', category: 'Governance' },
  { name: 'ROLE_CREATE', label: 'Manage Dynamic Roles', category: 'Governance' },
  { name: 'ROLE_READ', label: 'View Dynamic Roles', category: 'Governance' },
];

const DEFAULT_OFFICER_PERMS = [
  'CASE_CREATE', 'CASE_READ', 'CASE_UPDATE',
  'DOCUMENT_UPLOAD', 'DOCUMENT_READ', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_VERIFY',
  'EVIDENCE_CREATE', 'EVIDENCE_READ', 'CUSTODY_TRANSFER', 'CUSTODY_ACCEPT',
  'AUDIT_READ'
];

export const UsersPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.isSuperAdmin || user?.email?.trim().toLowerCase() === 'superadmin@gov.in';

  const [users, setUsers] = useState<MockUser[]>([]);
  const [allRegisteredOfficers, setAllRegisteredOfficers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New User Form States
  const [enrollMode, setEnrollMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [existingUserId, setExistingUserId] = useState('');
  const [userLookupQuery, setUserLookupQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<any | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Role Name & Organization Permissions Checkboxes
  const [customRoleTitle, setCustomRoleTitle] = useState('Investigating Officer');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(DEFAULT_OFFICER_PERMS);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');

  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');
  const [enrollOrgId, setEnrollOrgId] = useState<string>(user?.organizationId || '');

  useEffect(() => {
    getOrganizationsApi()
      .then((orgs) => {
        if (Array.isArray(orgs)) {
          setOrganizations(orgs);
          if (!enrollOrgId && orgs.length > 0) {
            setEnrollOrgId(user?.organizationId || orgs[0].id);
          }
        }
      })
      .catch(() => { });
  }, [user?.organizationId]);

  const fetchUsers = async () => {
    try {
      if (isSuperAdmin) {
        try {
          const superData = await getSuperAdminAllDataApi();
          if (superData && superData.success && Array.isArray(superData.users)) {
            if (Array.isArray(superData.organizations)) {
              setOrganizations(superData.organizations.map((o: any) => ({ id: o.id, name: o.name, code: o.code })));
            }
            setAllRegisteredOfficers(superData.users);

            let rawList = superData.users;
            if (selectedOrgId !== 'ALL') {
              rawList = rawList.filter((u: any) =>
                u.memberships?.some((m: any) => m.organization?.id === selectedOrgId || m.organizationId === selectedOrgId)
              );
            }

            const mapped: MockUser[] = rawList.map((u: any) => {
              const firstMembership = u.memberships && u.memberships.length > 0 ? u.memberships[0] : null;
              const orgName =
                u.organizationNames ||
                firstMembership?.organization?.name ||
                (u.email === 'superadmin@gov.in' ? 'Government of India (Super Admin)' : '⚡ Unassigned / Standalone');
              const roleName =
                u.roleNames ||
                firstMembership?.role?.name ||
                (u.email === 'superadmin@gov.in' ? 'Global Super Admin' : 'Registered Officer');

              return {
                id: u.id,
                name: u.name,
                email: u.email,
                designation: roleName,
                role: roleName,
                organization: orgName,
                status: (u.isActive ?? true) ? 'ACTIVE' : 'SUSPENDED',
                permissionsCount: 18,
                lastLogin: u.createdAt || new Date().toISOString(),
              };
            });
            setUsers(mapped);
            return;
          }
        } catch (superErr) {
          console.warn('Superadmin API fallback:', superErr);
        }
      }

      const activeOrgId = selectedOrgId !== 'ALL' ? selectedOrgId : 'all';
      const data = await getOrganizationUsersApi(activeOrgId);

      if (Array.isArray(data) && data.length > 0) {
        const mapped: MockUser[] = data.map((u: any) => {
          const userObj = u.user || u;
          const firstMembership = u.memberships && u.memberships.length > 0 ? u.memberships[0] : null;
          const orgName =
            u.organization?.name ||
            firstMembership?.organization?.name ||
            (userObj.email === 'superadmin@gov.in' ? 'Government of India (Super Admin)' : '⚡ Unassigned / Standalone');
          const roleName =
            u.role?.name ||
            firstMembership?.role?.name ||
            (userObj.email === 'superadmin@gov.in' ? 'Global Super Admin' : 'Registered Officer');

          return {
            id: userObj.id || u.id,
            name: userObj.name || u.name,
            email: userObj.email || u.email,
            designation: roleName,
            role: roleName,
            organization: orgName,
            status: (userObj.isActive ?? true) ? 'ACTIVE' : 'SUSPENDED',
            permissionsCount: 18,
            lastLogin: u.createdAt || userObj.createdAt || new Date().toISOString(),
          };
        });
        setUsers(mapped);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedOrgId, user?.organizationId, isSuperAdmin, organizations]);

  useEffect(() => {
    if (isAddUserOpen) {
      setUserLookupQuery('');
      setSearchedUser(null);
      setLookupError(null);
      setExistingUserId('');
      setCustomRoleTitle('Investigating Officer');
      setSelectedPermissions(DEFAULT_OFFICER_PERMS);
      if (!enrollOrgId && organizations.length > 0) {
        setEnrollOrgId(user?.organizationId || organizations[0].id);
      }
    }
  }, [isAddUserOpen, enrollOrgId, organizations]);

  const handleUserLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userLookupQuery.trim()) {
      setLookupError('Please enter an Email address or User ID to lookup.');
      return;
    }

    setIsSearchingUser(true);
    setLookupError(null);
    setSearchedUser(null);
    setExistingUserId('');

    const res = await lookupUserApi(userLookupQuery.trim());
    setIsSearchingUser(false);

    if (res.found && res.user) {
      setSearchedUser(res.user);
      setExistingUserId(res.user.id);
    } else {
      setLookupError(res.message || 'No registered officer found with that Email or User ID.');
    }
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSelectAllPerms = () => {
    setSelectedPermissions(ORG_PERMISSIONS_LIST.map((p) => p.name));
  };

  const handleClearAllPerms = () => {
    setSelectedPermissions([]);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Standalone Unassigned User Provisioning (Super Admin Only)
    if (enrollOrgId === 'NONE') {
      if (!name || !email || !password) {
        setErrorMessage('Officer Name, Official Email, and Password are required.');
        setIsSubmitting(false);
        return;
      }

      try {
        await createStandaloneUserApi({
          name,
          email,
          password,
        });

        setSuccessMessage(`✅ Standalone unassigned officer "${name}" (${email}) provisioned successfully! They have no organization affiliation and zero initial visibility until assigned.`);
        fetchUsers();
        setName('');
        setEmail('');
        setPassword('Password123!');
        setIsAddUserOpen(false);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to provision standalone user.';
        setErrorMessage(`Error: ${msg}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const orgToEnroll = enrollOrgId || (selectedOrgId !== 'ALL' ? selectedOrgId : null) || user?.organizationId || organizations[0]?.id;
    if (!orgToEnroll) {
      setErrorMessage('Please enroll or select an organization before creating an officer account.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (enrollMode === 'EXISTING') {
        if (!existingUserId) {
          setErrorMessage('Please search and verify an existing registered officer by Email or User ID first.');
          setIsSubmitting(false);
          return;
        }

        await createUserApi(orgToEnroll, {
          mode: 'EXISTING',
          existingUserId,
          roleName: customRoleTitle,
          permissions: selectedPermissions,
        });

        const officerName = searchedUser?.name || `User ID: ${existingUserId}`;
        setSuccessMessage(`✅ Existing officer "${officerName}" successfully enrolled into organization with role "${customRoleTitle}"!`);
      } else {
        await createUserApi(orgToEnroll, {
          mode: 'NEW',
          name,
          email,
          password,
          roleName: customRoleTitle,
          permissions: selectedPermissions,
        });

        setSuccessMessage(`✅ New officer "${name}" (${email}) provisioned successfully with role "${customRoleTitle}"!`);
      }

      fetchUsers();
      setName('');
      setEmail('');
      setExistingUserId('');
      setUserLookupQuery('');
      setSearchedUser(null);
      setPassword('Password123!');
      setIsAddUserOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add user to organization.';
      setErrorMessage(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#123B63]" />
            User Administration & Personnel Roster
          </h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Manage officer user accounts, search & enroll existing global officers by Email/ID, and assign custom roles with permission checkboxes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {organizations.length > 0 && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#DCE3EA] rounded-md text-xs font-semibold text-[#17212B] shadow-2xs focus:outline-none focus:border-[#123B63]"
            >
              <option value="ALL">All Enrolled Agencies ({organizations.length})</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          )}

          {(isSuperAdmin || (user?.organizationId && organizations.length > 0)) && (
            <Button
              variant="primary"
              onClick={() => setIsAddUserOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              size="sm"
            >
              Add Officer / User
            </Button>
          )}

          <div className="flex items-center gap-1 bg-[#F6F8FB] border border-[#DCE3EA] p-1 rounded-md">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-[#123B63] text-white' : 'text-[#5B6875] hover:text-[#123B63]'
                }`}
            >
              Officer Roster ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${activeTab === 'permissions' ? 'bg-[#123B63] text-white' : 'text-[#5B6875] hover:text-[#123B63]'
                }`}
            >
              Permission Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="flex items-start gap-2 p-3 bg-[#E6F4ED] border border-[#B2DDCE] rounded-md text-xs text-[#18794E] font-semibold">
          <CheckCircle className="w-4 h-4 text-[#18794E] shrink-0 mt-0.5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-[#18794E] hover:text-[#123B63] font-bold">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-md text-xs text-[#B42318] font-semibold">
          <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-[#B42318] hover:text-[#911B12] font-bold">✕</button>
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#5B6875] font-bold uppercase tracking-wider">
                <th className="p-3">Officer Name & Email</th>
                <th className="p-3">Role & Designation</th>
                <th className="p-3">Organization</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#5B6875]">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-[#F6F8FB] border border-[#DCE3EA] flex items-center justify-center text-[#5B6875]">
                        <ShieldCheck className="w-5 h-5 text-[#2F6B95]" />
                      </div>
                      <div className="font-bold text-[#123B63] text-sm">
                        {isSuperAdmin
                          ? 'No personnel found matching the selected agency filter.'
                          : 'Zero Personnel In Visibility Scope'}
                      </div>
                      <p className="text-xs text-[#5B6875] leading-relaxed">
                        {isSuperAdmin
                          ? 'Click "Add Officer / User" above to enroll personnel into the agency roster.'
                          : 'You are currently not assigned to any law enforcement agency or active case.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F6F8FB] transition-colors">
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-[#123B63] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#2F6B95] shrink-0" />
                        {u.name}
                      </div>
                      <div className="text-[11px] text-[#5B6875] flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-[#5B6875]" />
                        {u.email}
                      </div>
                    </td>
                    <td className="p-3 space-y-0.5">
                      <div className="text-[#17212B] font-semibold">{u.role}</div>
                      <div className="text-[11px] text-[#5B6875]">{u.designation}</div>
                    </td>
                    <td className="p-3 font-semibold text-[#123B63] flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#2F6B95]" />
                      {u.organization}
                    </td>
                    <td className="p-3">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        <ShieldCheck className="w-3 h-3 inline mr-1 text-[#18794E]" />
                        {u.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-[11px] text-[#5B6875] font-mono">
                      {new Date(u.lastLogin).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <PermissionMatrix permissions={INITIAL_PERMISSIONS} />
      )}

      {/* Modal: Add User / Enroll Officer */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title={enrollOrgId === 'NONE' ? 'Provision Standalone Officer (No Agency Affiliation)' : 'Add Officer / Enroll Global User into Organization'}
        maxWidth="lg"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs">
          {/* Agency Assignment */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              Assign to Law Enforcement Agency / Department *
            </label>
            <select
              value={enrollOrgId}
              onChange={(e) => setEnrollOrgId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
              required
            >
              {isSuperAdmin && (
                <option value="NONE">
                  ⚡ Standalone Officer (No Agency Affiliation)
                </option>
              )}
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>

          {enrollOrgId === 'NONE' ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  Zero-Trust Standalone Officer Provisioning
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  This user account will be created with <strong>no organization</strong>. Upon logging in, they will have strictly <strong>zero visibility</strong> (no organizations, no cases, and no other users) until assigned as an admin or participant by an authorized officer.
                </p>
              </div>

              <Input
                label="Officer Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inspector Ramesh Varma"
                required
              />

              <Input
                label="Official Officer Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@standalone.gov.in"
                required
              />

              <Input
                label="Account Password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
          ) : (
            <>
              {/* Enroll Mode Toggle */}
              <div className="flex rounded border border-slate-300 p-1 bg-slate-100 gap-1">
                <button
                  type="button"
                  onClick={() => setEnrollMode('EXISTING')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${enrollMode === 'EXISTING' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
                    }`}
                >
                  Enroll Existing Global User (Search by Email/ID)
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollMode('NEW')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${enrollMode === 'NEW' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
                    }`}
                >
                  Provision New User Account
                </button>
              </div>

              {enrollMode === 'EXISTING' ? (
                <div className="space-y-3">
                  {allRegisteredOfficers.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        Select from System Registered Officers ({allRegisteredOfficers.length})
                      </label>
                      <select
                        value={existingUserId}
                        onChange={(e) => {
                          const uid = e.target.value;
                          setExistingUserId(uid);
                          const target = allRegisteredOfficers.find((u) => u.id === uid);
                          if (target) {
                            setSearchedUser(target);
                            setUserLookupQuery(target.email);
                            setLookupError(null);
                          } else {
                            setSearchedUser(null);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                      >
                        <option value="">-- Choose Registered Officer to Enroll into Agency --</option>
                        {allRegisteredOfficers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) — {u.isUnassigned ? '⚡ Standalone / Unassigned' : u.organizationNames || 'Enrolled'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 border-t border-slate-200"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Or Search by Email / ID</span>
                    <div className="flex-1 border-t border-slate-200"></div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                    <strong>Zero-Trust Officer Lookup:</strong> Select an officer from the list above or enter their exact Email or User ID below.
                  </div>

                  {/* Direct Search/Lookup Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase">
                      Search Officer by Email or User ID *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. priya.sharma@ed.gov.in or cm123abc..."
                        value={userLookupQuery}
                        onChange={(e) => setUserLookupQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUserLookup();
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleUserLookup}
                        isLoading={isSearchingUser}
                        leftIcon={<Search className="w-3.5 h-3.5" />}
                      >
                        Lookup
                      </Button>
                    </div>
                  </div>

                  {/* Lookup Result Box */}
                  {searchedUser && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1 text-xs text-emerald-950 font-medium">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        Officer Verified: {searchedUser.name} ({searchedUser.email})
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono">
                        User ID: {searchedUser.id}
                      </div>
                    </div>
                  )}

                  {lookupError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{lookupError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px]">
                    <strong>Create New Account:</strong> Create a brand new user account and assign credentials for immediate login.
                  </div>

                  <Input
                    label="Officer Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Inspector Ramesh Varma"
                    required
                  />

                  <Input
                    label="Official Officer Email *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@cbi.gov.in"
                    required
                  />

                  <Input
                    label="Account Password *"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              )}

              {/* Custom Free-Text Role Title */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <Input
                  label="Role Title / Designation (Free-Text Input) *"
                  value={customRoleTitle}
                  onChange={(e) => setCustomRoleTitle(e.target.value)}
                  placeholder="e.g. Investigating Officer, Senior Forensic Lead, Org Admin..."
                  required
                />

                {/* Organization Permission Checkboxes Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-600" />
                      Organization-Level Permission Checkboxes ({selectedPermissions.length} selected)
                    </label>
                    <div className="flex gap-2 text-[10px]">
                      <button type="button" onClick={handleSelectAllPerms} className="text-indigo-600 font-bold hover:underline">
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button type="button" onClick={handleClearAllPerms} className="text-slate-500 font-bold hover:underline">
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded max-h-56 overflow-y-auto space-y-3">
                    {['Cases', 'Documents', 'Evidence', 'Governance'].map((cat) => (
                      <div key={cat} className="space-y-1.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-0.5">
                          {cat} Operations
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ORG_PERMISSIONS_LIST.filter((p) => p.category === cat).map((p) => {
                            const isChecked = selectedPermissions.includes(p.name);
                            return (
                              <label
                                key={p.name}
                                className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer text-xs ${isChecked
                                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(p.name)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                                <span>{p.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<UserPlus className="w-4 h-4" />}>
              {enrollOrgId === 'NONE'
                ? 'Provision Standalone Officer'
                : enrollMode === 'EXISTING'
                  ? 'Enroll Officer into Org'
                  : 'Provision New Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
