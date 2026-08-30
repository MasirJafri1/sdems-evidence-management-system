import React from 'react';
import type { MockAuditEvent } from '../../../mock/audit.mock';
import { Badge } from '../../../components/ui/Badge';
import { Fingerprint, CheckCircle2 } from 'lucide-react';

interface AuditTableProps {
  events: MockAuditEvent[];
}

export const AuditTable: React.FC<AuditTableProps> = ({ events }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
            <th className="p-3 text-center">Seq #</th>
            <th className="p-3">Timestamp</th>
            <th className="p-3">Event Type</th>
            <th className="p-3">Actor & Organization</th>
            <th className="p-3">Case ID</th>
            <th className="p-3">Event SHA-256 Hash</th>
            <th className="p-3">Integrity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium bg-white">
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="p-3 text-center font-mono font-bold text-slate-900">#{e.sequence}</td>
              <td className="p-3 text-slate-600 font-mono text-[11px]">
                {new Date(e.timestamp).toLocaleString()}
              </td>
              <td className="p-3">
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {e.eventType}
                </span>
              </td>
              <td className="p-3 space-y-0.5">
                <div className="text-slate-900 font-semibold">{e.actor}</div>
                <div className="text-[11px] text-slate-500">{e.organization}</div>
              </td>
              <td className="p-3 font-mono font-bold text-blue-800">{e.caseNumber}</td>
              <td className="p-3 font-mono text-[11px] text-slate-700">
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-fit">
                  <Fingerprint className="w-3 h-3 text-slate-400" />
                  {e.eventHash.slice(0, 12)}...{e.eventHash.slice(-6)}
                </span>
              </td>
              <td className="p-3">
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  {e.integrity}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
