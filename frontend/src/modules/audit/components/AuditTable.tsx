import React from 'react';
import type { MockAuditEvent } from '../../../mock/audit.mock';
import { Badge } from '../../../components/ui/Badge';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { Fingerprint, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface AuditTableProps {
  events: MockAuditEvent[];
  isLoading?: boolean;
}

export const AuditTable: React.FC<AuditTableProps> = ({ events, isLoading = false }) => {
  return (
    <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#5B6875] font-bold uppercase tracking-wider">
            <th className="p-3 text-center">Seq #</th>
            <th className="p-3">Timestamp</th>
            <th className="p-3">Event Action</th>
            <th className="p-3">Actor & Organization</th>
            <th className="p-3">Case ID / Resource</th>
            <th className="p-3">SHA-256 Hash Digest</th>
            <th className="p-3">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-[#5B6875] italic">
                No audit events recorded in ledger.
              </td>
            </tr>
          ) : (
            events.map((e) => {
              const isDocVerification = e.eventType.includes('DOCUMENT VERIFIED') || e.eventType.includes('DOCUMENT_VERIFIED');
              const isCompromised = e.integrity === 'COMPROMISED';
              const isBlocked = e.integrity === 'BLOCKED';

              return (
                <tr
                  key={e.id}
                  className={`transition-colors ${
                    isCompromised
                      ? 'bg-[#FEF3F2]/70 hover:bg-[#FEF3F2]'
                      : isBlocked
                      ? 'bg-[#FFF8E6]/60 hover:bg-[#FFF8E6]'
                      : 'hover:bg-[#F6F8FB]'
                  }`}
                >
                  <td className="p-3 text-center font-mono font-bold text-[#123B63]">#{e.sequence}</td>
                  <td className="p-3 text-[#5B6875] font-mono text-[11px]">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                        isCompromised
                          ? 'text-[#B42318] bg-[#FEF3F2] border-[#FECDCA]'
                          : isDocVerification
                          ? 'text-[#18794E] bg-[#E6F4ED] border-[#B2DDCE]'
                          : 'text-[#123B63] bg-[#EBF3FA] border-[#B8D3EA]'
                      }`}
                    >
                      {isCompromised && <AlertTriangle className="w-3 h-3 text-[#B42318] inline" />}
                      {e.eventType}
                    </span>
                    {e.metadata?.documentTitle && (
                      <div className="text-[10px] text-[#5B6875] font-mono mt-0.5">
                        {e.metadata.documentTitle}
                        {e.metadata?.status && (
                          <span className={isCompromised ? ' text-[#B42318] font-bold' : ' text-[#18794E] font-bold'}>
                            {' '}[{e.metadata.status}]
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 space-y-0.5">
                    <div className="text-[#17212B] font-semibold">{e.actor}</div>
                    <div className="text-[11px] text-[#5B6875]">{e.organization}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-[#2F6B95]">{e.caseNumber}</td>
                  <td className="p-3 font-mono text-[11px] text-[#17212B]">
                    <span className="bg-[#F6F8FB] px-2 py-0.5 rounded border border-[#DCE3EA] flex items-center gap-1 w-fit">
                      <Fingerprint className="w-3 h-3 text-[#2F6B95]" />
                      {e.eventHash.slice(0, 12)}...{e.eventHash.slice(-6)}
                    </span>
                  </td>
                  <td className="p-3">
                    {isCompromised ? (
                      <Badge variant="danger" size="sm">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        COMPROMISED
                      </Badge>
                    ) : isBlocked ? (
                      <Badge variant="danger" size="sm">
                        <ShieldAlert className="w-3 h-3 inline mr-1" />
                        ACCESS DENIED
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 inline mr-1 text-[#18794E]" />
                        VALID
                      </Badge>
                    )}
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

