import React from 'react';

interface CaseFiltersProps {
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
}

export const CaseFilters: React.FC<CaseFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
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
