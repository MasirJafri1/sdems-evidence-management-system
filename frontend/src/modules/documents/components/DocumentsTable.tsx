import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockDocument } from '../../../mock/documents.mock';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { FileText, ShieldCheck, Fingerprint } from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

interface DocumentsTableProps {
  documents: MockDocument[];
  isLoading?: boolean;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#5B6875] font-bold uppercase tracking-wider">
            <th className="p-3">Document Name & Case</th>
            <th className="p-3">Type & Version</th>
            <th className="p-3">Uploaded By & Date</th>
            <th className="p-3">SHA-256 Digest</th>
            <th className="p-3">On-Chain Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : documents.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-[#5B6875] italic">
                No official document exhibits recorded in database.
              </td>
            </tr>
          ) : (
            documents.map((d) => (
              <tr key={d.id} className="hover:bg-[#F6F8FB] transition-colors">
                <td className="p-3 space-y-0.5">
                  <div className="font-bold text-[#123B63] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#2F6B95] shrink-0" />
                    {d.documentName}
                  </div>
                  <div className="font-mono text-[11px] text-[#5B6875]">{d.caseNumber}</div>
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="text-[#17212B] font-semibold">{d.documentType}</div>
                  <Badge variant="info" size="sm">v{d.version}</Badge>
                </td>
                <td className="p-3 space-y-0.5">
                  <div className="text-[#17212B] font-semibold">{d.uploadedBy}</div>
                  <div className="text-[11px] text-[#5B6875]">{new Date(d.uploadedDate).toLocaleDateString()}</div>
                </td>
                <td className="p-3 font-mono text-[11px] text-[#17212B]">
                  <span className="bg-[#F6F8FB] px-2 py-0.5 rounded border border-[#DCE3EA] flex items-center gap-1 w-fit font-semibold">
                    <Fingerprint className="w-3 h-3 text-[#2F6B95]" />
                    {d.sha256Hash.slice(0, 10)}...{d.sha256Hash.slice(-6)}
                  </span>
                </td>
                <td className="p-3">
                  <Badge variant="success" size="sm">
                    <ShieldCheck className="w-3 h-3 inline mr-1 text-[#18794E]" />
                    {d.blockchainStatus}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(ROUTES.PROTECTED.DOCUMENTS.DETAIL.replace(':documentId', d.id))
                    }
                  >
                    View Exhibit
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

