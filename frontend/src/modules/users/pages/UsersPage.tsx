import React, { useState, useEffect } from 'react';

import { useAppSelector } from '../../../store';
import {
  getOrganizationUsersApi,
  createUserApi,
  getAllRegisteredOfficersApi,
  getOrganizationRolesApi,
} from '../../organizations/api/organization.api';

import { PermissionMatrix } from '../components/PermissionMatrix';
import { INITIAL_PERMISSIONS, type MockUser } from '../../../mock/users.mock';
import { Users, Building, ShieldCheck, Mail, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';

export const UsersPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New User Form States
  const [enrollMode, setEnrollMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [existingUserId, setExistingUserId] = useState('');
  const [registeredOfficers, setRegisteredOfficers] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');

  const targetOrgId = user?.organizationId || 'cmtfg5cer0000mh0w2bnhp068';
  const isSuperAdmin = user?.isSuperAdmin || user?.email === 'superadmin@gov.in';

  const fetchUsers = async () => {
    try {
      const data = isSuperAdmin
        ? await getAllRegisteredOfficersApi()
        : await getOrganizationUsersApi(targetOrgId);

      if (Array.isArray(data) && data.length > 0) {
        const mapped: MockUser[] = data.map((u: any) => {
          const userObj = u.user || u;
          const firstMembership = u.memberships && u.memberships.length > 0 ? u.memberships[0] : null;
          const orgName = u.organization?.name || firstMembership?.organization?.name || (isSuperAdmin ? 'System Wide' : 'Enrolled Organization');
          const roleName = u.role?.name || firstMembership?.role?.name || (userObj.email === 'superadmin@gov.in' ? 'Global Super Admin' : 'Organization Admin');

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
  }, [targetOrgId, isSuperAdmin]);

  useEffect(() => {
    if (isAddUserOpen) {
      getAllRegisteredOfficersApi()
        .then((data) => {
          if (Array.isArray(data)) setRegisteredOfficers(data);
        })
        .catch(() => setRegisteredOfficers([]));

      getOrganizationRolesApi(targetOrgId)
        .then((roles) => {
          if (Array.isArray(roles) && roles.length > 0) {
            setAvailableRoles(roles);
            setSelectedRoleId(roles[0].id);
          } else {
            setAvailableRoles([]);
            setSelectedRoleId('');
          }
        })
        .catch(() => setAvailableRoles([]));
    }
  }, [isAddUserOpen, targetOrgId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const activeRoleId = selectedRoleId || (availableRoles.length > 0 ? availableRoles[0].id : undefined);

    try {
      if (enrollMode === 'EXISTING') {
        if (!existingUserId) {
          setErrorMessage('Please select an existing registered global user ID.');
          setIsSubmitting(false);
          return;
        }

        await createUserApi(targetOrgId, {
          mode: 'EXISTING',
          existingUserId,
          roleId: activeRoleId,
        });

        const selectedOfficer = registeredOfficers.find((o) => o.id === existingUserId);
        const officerName = selectedOfficer?.name || `User ID: ${existingUserId}`;
        setSuccessMessage(`✅ Existing global user "${officerName}" enrolled into organization!`);
      } else {
        await createUserApi(targetOrgId, {
          mode: 'NEW',
          name,
          email,
          password,
          roleId: activeRoleId,
        });

        setSuccessMessage(`✅ New officer "${name}" (${email}) provisioned successfully!`);
      }

      fetchUsers();
      setName('');
      setEmail('');
      setExistingUserId('');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <Users className="w-7 h-7 text-slate-900" />
            User Administration & Personnel Roster
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage officer user accounts, enroll existing global users by ID, and inspect RBAC permission boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setIsAddUserOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Officer / User
          </Button>

          <div className="flex items-center gap-1 bg-slate-200 p-1 rounded">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'users' ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Officer Roster ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'permissions' ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Permission Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-600 hover:text-red-800 font-bold">✕</button>
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                <th className="p-3">Officer Name & Email</th>
                <th className="p-3">Role & Designation</th>
                <th className="p-3">Organization</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                    No users or officers registered yet in this roster. Click "Add Officer / User" above to enroll personnel.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-700 shrink-0" />
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="p-3 space-y-0.5">
                      <div className="text-slate-800 font-semibold">{u.role}</div>
                      <div className="text-[11px] text-slate-500">{u.designation}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {u.organization}
                    </td>
                    <td className="p-3">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                        {u.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">
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
        title="Add Officer / Enroll Global User into Organization"
        maxWidth="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs">
          {/* Enroll Mode Toggle */}
          <div className="flex rounded border border-slate-300 p-1 bg-slate-100 gap-1">
            <button
              type="button"
              onClick={() => setEnrollMode('EXISTING')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                enrollMode === 'EXISTING' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
              }`}
            >
              Enroll Existing Global User (By User ID)
            </button>
            <button
              type="button"
              onClick={() => setEnrollMode('NEW')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                enrollMode === 'NEW' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
              }`}
            >
              Provision New User Account
            </button>
          </div>

          {enrollMode === 'EXISTING' ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                <strong>Enroll User from another Org or Unassigned User:</strong> You can select any existing officer (from another organization or an unassigned user) by their User ID/Email to enroll them into this organization.
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Select User from another Org or Unassigned User *
                </label>
                <select
                  value={existingUserId}
                  onChange={(e) => setExistingUserId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  required
                >
                  <option value="">-- Choose User from another Org / Unassigned User --</option>
                  {registeredOfficers
                    .filter((o) => {
                      const isAlreadyInTarget = o.memberships?.some(
                        (m: any) => m.organizationId === targetOrgId || m.organization?.id === targetOrgId
                      );
                      return !isAlreadyInTarget;
                    })
                    .map((o) => {
                      const orgName =
                        o.memberships && o.memberships.length > 0
                          ? o.memberships.map((m: any) => m.organization?.name || m.organization?.code).join(', ')
                          : 'Unassigned User';

                      return (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.email}) — [{orgName}] — ID: {o.id}
                        </option>
                      );
                    })}
                </select>
              </div>

              <Input
                label="Or Enter Exact User ID manually"
                placeholder="e.g. cm123abc..."
                value={existingUserId}
                onChange={(e) => setExistingUserId(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px]">
                <strong>Create New Account:</strong> Create a brand new global user account and assign credentials for immediate login.
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

          <div className="flex flex-col gap-1 pt-2 border-t border-slate-200">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Assign Organization Role (Dynamic) *
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 font-medium"
            >
              {availableRoles.length > 0 ? (
                availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))
              ) : (
                <option value="">Organization Admin / Officer (Default)</option>
              )}
            </select>
            <span className="text-[11px] text-slate-500">
              Select from available organization roles or default administrative permissions.
            </span>
          </div>
        </div>
      )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<UserPlus className="w-4 h-4" />}>
              {enrollMode === 'EXISTING' ? 'Enroll Officer into Org' : 'Provision New Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
