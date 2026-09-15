import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockEvidence } from '../../../mock/evidence.mock';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { Box, GitCommit, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

interface EvidenceTableProps {
  evidence: MockEvidence[];
  isLoading?: boolean;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({ evidence, isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#5B6875] font-bold uppercase tracking-wider">
            <th className="p-3">Evidence Number & Title</th>
            <th className="p-3">Type & Serial</th>
            <th className="p-3">Status</th>
            <th className="p-3">Current Custodian & Location</th>
            <th className="p-3">Custody Chain</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : evidence.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[#5B6875] italic">
                No physical evidence items logged in registry.
              </td>
            </tr>
          ) : (
            evidence.map((e) => {
              let statusVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' = 'neutral';
              let statusLabel: string = e.status;
              if (e.status === 'In Custody') {
                statusVariant = 'success';
                statusLabel = '✓ Verified';
              } else if (e.status === 'Transfer Pending') {
                statusVariant = 'warning';
                statusLabel = 'Under Review';
              } else if (e.status === 'Archived') {
                statusVariant = 'info';
                statusLabel = '✓ Anchored';
              } else if ((e.status as string) === 'Alert') {
                statusVariant = 'danger';
                statusLabel = 'Integrity Alert';
              }

              return (
                <tr key={e.id} className="hover:bg-[#F6F8FB] transition-colors">
                  <td className="p-3 space-y-0.5">
                    <div className="font-mono font-bold text-[#123B63] flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-[#2F6B95] shrink-0" />
                      {e.evidenceNumber}
                    </div>
                    <div className="font-semibold text-[#17212B]">{e.title}</div>
                  </td>
                  <td className="p-3 space-y-0.5">
                    <div className="text-[#17212B] font-semibold">{e.evidenceType}</div>
                    <div className="font-mono text-[11px] text-[#5B6875]">{e.serialNumber}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant={statusVariant} size="sm">
                      {statusLabel}
                    </Badge>
                  </td>
                  <td className="p-3 space-y-0.5">
                    <div className="text-[#17212B] font-semibold">{e.currentCustodian}</div>
                    <div className="text-[11px] text-[#5B6875]">{e.storageLocation}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="w-3 h-3 inline mr-1 text-[#18794E]" />
                      {e.custodyChainStatus}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(ROUTES.PROTECTED.EVIDENCE.DETAIL.replace(':evidenceId', e.id))
                      }
                      leftIcon={<GitCommit className="w-3.5 h-3.5" />}
                    >
                      View Record
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

