import React from 'react';
import type { SimpleOrg } from '../hooks/useCaseList';
import { Building } from 'lucide-react';

interface CaseFiltersProps {
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  selectedOrgId: string;
  setSelectedOrgId: (val: string) => void;
  organizations: SimpleOrg[];
}

export const CaseFilters: React.FC<CaseFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  selectedOrgId,
  setSelectedOrgId,
  organizations,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Organization Filter */}
      <div className="relative flex items-center">
        <Building className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="pl-8 pr-4 py-1.5 bg-white border border-indigo-300 rounded text-xs text-indigo-950 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        >
          <option value="ALL">🏢 All Organizations / Agencies</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.code})
            </option>
          ))}
        </select>
      </div>

      {/* Case Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
      >
        <option value="ALL">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Under Review">Under Review</option>
        <option value="Pending Verification">Pending Verification</option>
        <option value="Closed">Closed</option>
        <option value="Archived">Archived</option>
      </select>

      {/* Case Type Filter */}
      <input
        type="text"
        placeholder="Filter by case type..."
        value={typeFilter === 'ALL' ? '' : typeFilter}
        onChange={(e) => setTypeFilter(e.target.value.trim() ? e.target.value : 'ALL')}
        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-800"
      />
    </div>
  );
};
