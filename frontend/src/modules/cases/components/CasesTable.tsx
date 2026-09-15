import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockCase } from '../../../mock/cases.mock';
import { CaseStatusBadge } from './CaseStatusBadge';
import { Button } from '../../../components/ui/Button';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { ROUTES } from '../../../config/routes.config';
import { FolderArchive } from 'lucide-react';

interface CasesTableProps {
  cases: MockCase[];
  isLoading?: boolean;
}

export const CasesTable: React.FC<CasesTableProps> = ({ cases, isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#5B6875] font-bold uppercase tracking-wider">
            <th className="p-3">Case ID & Ref</th>
            <th className="p-3">Title & Type</th>
            <th className="p-3">Status</th>
            <th className="p-3">Organization & Lead</th>
            <th className="p-3 text-center">Items</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : cases.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[#5B6875] italic">
                No official case records match the specified filters.
              </td>
            </tr>
          ) : (
            cases.map((c) => (
              <tr key={c.id} className="hover:bg-[#F6F8FB] transition-colors">
                <td className="p-3 space-y-0.5">
                  <div className="font-mono font-bold text-[#123B63]">{c.caseNumber}</div>
                  <div className="text-[11px] text-[#5B6875] font-mono">{c.referenceNumber}</div>
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="font-semibold text-[#17212B]">{c.title}</div>
                  <div className="text-[11px] text-[#5B6875]">{c.caseType}</div>
                </td>
                <td className="p-3">
                  <CaseStatusBadge status={c.status} />
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="text-[#17212B] font-semibold">{c.organization}</div>
                  <div className="text-[11px] text-[#5B6875]">{c.leadOfficer}</div>
                </td>
                <td className="p-3 text-center font-mono font-bold">
                  <span className="text-[#2F6B95]">{c.evidenceCount} Evid</span> / <span className="text-[#5B6875]">{c.documentCount} Docs</span>
                </td>
                <td className="p-3 text-right">
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
