import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockEvidence } from '../../../mock/evidence.mock';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Box, GitCommit, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

interface EvidenceTableProps {
  evidence: MockEvidence[];
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({ evidence }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border border-slate-200 rounded">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
            <th className="p-3">Evidence Number & Title</th>
            <th className="p-3">Type & Serial</th>
            <th className="p-3">Status</th>
            <th className="p-3">Current Custodian & Location</th>
            <th className="p-3">Custody Chain</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium bg-white">
          {evidence.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="p-3 space-y-0.5">
                <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-blue-700 shrink-0" />
                  {e.evidenceNumber}
                </div>
                <div className="font-semibold text-slate-800">{e.title}</div>
              </td>
              <td className="p-3 space-y-0.5">
                <div className="text-slate-900 font-semibold">{e.evidenceType}</div>
                <div className="font-mono text-[11px] text-slate-500">{e.serialNumber}</div>
              </td>
              <td className="p-3">
                <Badge variant={e.status === 'In Custody' ? 'success' : e.status === 'Transfer Pending' ? 'warning' : 'neutral'} size="sm">
                  {e.status}
                </Badge>
              </td>
              <td className="p-3 space-y-0.5">
                <div className="text-slate-800 font-semibold">{e.currentCustodian}</div>
                <div className="text-[11px] text-slate-500">{e.storageLocation}</div>
              </td>
              <td className="p-3">
                <Badge variant="success" size="sm">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  {e.custodyChainStatus}
                </Badge>
              </td>
              <td className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(ROUTES.PROTECTED.EVIDENCE.DETAIL.replace(':evidenceId', e.id))
                  }
                  leftIcon={<GitCommit className="w-3.5 h-3.5" />}
                >
                  View Custody
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
