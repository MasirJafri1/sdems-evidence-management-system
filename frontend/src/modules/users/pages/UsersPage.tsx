import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store';
import { getOrganizationUsersApi } from '../../organizations/api/organization.api';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { INITIAL_PERMISSIONS, type MockUser } from '../../../mock/users.mock';
import { Users, Building, ShieldCheck, Mail } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export const UsersPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  const targetOrgId = user?.organizationId || 'cmtfg5cer0000mh0w2bnhp068';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getOrganizationUsersApi(targetOrgId);
        if (Array.isArray(data)) {
          const mapped: MockUser[] = data.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            designation: u.email === 'admin@cbi.gov' ? 'Organization Admin' : 'Senior Inspector',
            role: u.email === 'admin@cbi.gov' ? 'Organization Admin' : 'Investigator Lead',
            organization: 'Central Bureau of Investigation',
            status: u.isActive ? 'ACTIVE' : 'SUSPENDED',
            permissionsCount: 18,
            lastLogin: u.createdAt,
          }));
          setUsers(mapped);
        }
      } catch (err: any) {
        setUsers([]);
      }
    };

    fetchUsers();
  }, [targetOrgId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <Users className="w-7 h-7 text-slate-900" />
            User Administration & ABAC Access Control
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Role-based access permissions, active officer credentials, and organization access boundaries.
          </p>
        </div>

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
              {users.map((u) => (
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PermissionMatrix permissions={INITIAL_PERMISSIONS} />
      )}
    </div>
  );
};
