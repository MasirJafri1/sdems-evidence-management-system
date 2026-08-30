import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockCase } from '../../../mock/cases.mock';
import { CaseStatusBadge } from './CaseStatusBadge';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../config/routes.config';
import { FolderArchive, Loader2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

interface CasesTableProps {
  cases: MockCase[];
  isLoading?: boolean;
}

export const CasesTable: React.FC<CasesTableProps> = ({ cases, isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border border-slate-200 rounded">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
            <th className="p-3">Case ID & Ref</th>
            <th className="p-3">Title & Type</th>
            <th className="p-3">Priority</th>
            <th className="p-3">Status</th>
            <th className="p-3">Organization & Lead</th>
            <th className="p-3 text-center">Items</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                  <span>Loading case registry from database...</span>
                </div>
              </td>
            </tr>
          ) : cases.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500">
                No official case records match the specified filters.
              </td>
            </tr>
          ) : (
            cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-3 space-y-0.5">
                  <div className="font-mono font-bold text-slate-900">{c.caseNumber}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{c.referenceNumber}</div>
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="font-bold text-slate-900">{c.title}</div>
                  <div className="text-[11px] text-slate-500">{c.caseType}</div>
                </td>
                <td className="p-3">
                  <Badge variant={c.priority === 'CRITICAL' ? 'danger' : c.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                    {c.priority}
                  </Badge>
                </td>
                <td className="p-3">
                  <CaseStatusBadge status={c.status} />
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="text-slate-800 font-semibold">{c.organization}</div>
                  <div className="text-[11px] text-slate-500">{c.leadOfficer}</div>
                </td>
                <td className="p-3 text-center font-mono font-bold">
                  <span className="text-blue-800">{c.evidenceCount} Evid</span> / <span className="text-slate-700">{c.documentCount} Docs</span>
                </td>
                <td className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(ROUTES.PROTECTED.CASES.DETAIL.replace(':caseId', c.id))
                    }
                    leftIcon={<FolderArchive className="w-3.5 h-3.5" />}
                  >
                    Open Record
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
