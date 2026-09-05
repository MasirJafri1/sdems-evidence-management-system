import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Building, ShieldCheck, Plus, Users, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import { createOrganizationApi, getOrganizationsApi, getAllRegisteredOfficersApi } from '../api/organization.api';



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

interface RegisteredOfficer {
  id: string;
  name: string;
  email: string;
}

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for Organization Bootstrap
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  
  // Compulsory Admin Assignment state: 'NEW' | 'EXISTING'
  const [adminType, setAdminType] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingUserId, setExistingUserId] = useState('');
  const [registeredOfficers, setRegisteredOfficers] = useState<RegisteredOfficer[]>([]);
  
  // New Admin details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Password123!');

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const loadData = async () => {
    try {
      const [orgs, officers] = await Promise.all([
        getOrganizationsApi(),
        getAllRegisteredOfficersApi()
      ]);

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

      if (Array.isArray(officers)) {
        setRegisteredOfficers(officers);
      }
    } catch (err) {
      console.error('Failed to load organization data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (adminType === 'EXISTING' && !existingUserId) {
      setErrorMessage('Compulsory: Please select an existing registered officer as Organization Admin.');
      setIsSubmitting(false);
      return;
    }

    if (adminType === 'NEW' && (!adminName || !adminEmail || !adminPassword)) {
      setErrorMessage('Compulsory: Please fill all fields to create a new Organization Admin account.');
      setIsSubmitting(false);
      return;
    }

    try {
      const selectedOfficer = registeredOfficers.find(o => o.id === existingUserId);

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

      const assignedAdminName = adminType === 'EXISTING' ? (selectedOfficer?.name || 'Assigned Officer') : adminName;
      const assignedAdminEmail = adminType === 'EXISTING' ? (selectedOfficer?.email || 'officer@gov.in') : adminEmail;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <Building className="w-7 h-7 text-slate-900" />
            Multi-Tenant Organization Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Register government organizations, manage active agency rosters, and assign organization administrator authority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/users')}
            leftIcon={<Users className="w-4 h-4 text-indigo-600" />}
          >
            Manage Users & Roster (User Tab)
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

      {/* Organization Cards */}
      {organizations.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-300 bg-slate-50 rounded-lg text-center space-y-3">
          <Building className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Organizations Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              As Super Admin, click "Register Organization" above to register an organization and assign a compulsory Org Admin.
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
                  <span className="text-slate-500 font-medium">Enrolled Personnel:</span>
                  <span className="font-bold text-slate-900">{o.members.length} Officers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Active Containers:</span>
                  <span className="font-bold text-slate-900">{o.casesCount} Cases</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Badge variant="success" size="sm">
                    <ShieldCheck className="w-3 h-3 inline mr-1" />
                    {o.securityLevel}
                  </Badge>
                  <Button
                    variant={selectedOrgId === o.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedOrgId(o.id)}
                  >
                    {selectedOrgId === o.id ? 'Viewing Roster' : 'Select Roster'}
                  </Button>
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
              <h2 className="text-sm font-extrabold text-slate-900 font-heading flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                Personnel Roster for {currentSelectedOrg.name}
              </h2>
              <p className="text-[11px] text-slate-500">
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

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3">Officer Name & Badge</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Department / Division</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium bg-white">
                {currentSelectedOrg.members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                      No personnel assigned yet. Go to the Users tab to add new officers.
                    </td>
                  </tr>
                ) : (
                  currentSelectedOrg.members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{m.badgeNumber}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="neutral" size="sm">
                          {m.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">{m.department}</td>
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
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
            <strong>Compulsory Admin Assignment:</strong> Every new organization must be assigned an Organization Admin. You can either select an existing registered officer or create a new user on the go.
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
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Compulsory Organization Admin Assignment <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdminType('NEW')}
                className={`p-3 text-left rounded border transition-colors ${
                  adminType === 'NEW'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Create New User
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Provision new login credentials on the go
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdminType('EXISTING')}
                className={`p-3 text-left rounded border transition-colors ${
                  adminType === 'EXISTING'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Assign Registered Officer
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Select existing registered officer from database
                </div>
              </button>
            </div>

            {/* Mode A: Select Existing Registered Officer */}
            {adminType === 'EXISTING' ? (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Registered Officer <span className="text-red-500">*</span>
                </label>
                <select
                  value={existingUserId}
                  onChange={(e) => setExistingUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Choose Registered Officer --</option>
                  {registeredOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Selected officer will gain Organization Admin superpowers restricted to this organization.
                </p>
              </div>
            ) : (
              /* Mode B: Create New Admin User on the Go */
              <div className="space-y-3 pt-2">
                <Input
                  label="Admin Officer Full Name *"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Inspector General Rajesh Sharma"
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
                <p className="text-[11px] text-slate-500">
                  This user will be registered in the system and can log in at the portal with these credentials.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
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
