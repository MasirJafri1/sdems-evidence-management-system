import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockDocument } from '../../../mock/documents.mock';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FileText, ShieldCheck, Fingerprint } from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

interface DocumentsTableProps {
  documents: MockDocument[];
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border border-slate-200 rounded">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
            <th className="p-3">Document Name & Case</th>
            <th className="p-3">Type & Version</th>
            <th className="p-3">Uploaded By & Date</th>
            <th className="p-3">SHA-256 Digest</th>
            <th className="p-3">On-Chain Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium bg-white">
          {documents.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="p-3 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                  {d.documentName}
                </div>
                <div className="font-mono text-[11px] text-slate-500">{d.caseNumber}</div>
              </td>
              <td className="p-3 space-y-0.5">
                <div className="text-slate-800 font-semibold">{d.documentType}</div>
                <Badge variant="info" size="sm">v{d.version}</Badge>
              </td>
              <td className="p-3 space-y-0.5">
                <div className="text-slate-800 font-semibold">{d.uploadedBy}</div>
                <div className="text-[11px] text-slate-500">{new Date(d.uploadedDate).toLocaleDateString()}</div>
              </td>
              <td className="p-3 font-mono text-[11px] text-slate-700">
                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-fit">
                  <Fingerprint className="w-3 h-3 text-slate-500" />
                  {d.sha256Hash.slice(0, 10)}...{d.sha256Hash.slice(-6)}
                </span>
              </td>
              <td className="p-3">
                <Badge variant="success" size="sm">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  {d.blockchainStatus}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(ROUTES.PROTECTED.DOCUMENTS.DETAIL.replace(':documentId', d.id))
                    }
                  >
                    Details
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
