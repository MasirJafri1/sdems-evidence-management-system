import React from 'react';
import type { CustodyEvent } from '../../../mock/evidence.mock';
import { Badge } from '../../../components/ui/Badge';
import { ShieldCheck, User, MapPin, Clock, Fingerprint } from 'lucide-react';

interface CustodyTimelineProps {
  events: CustodyEvent[];
}

export const CustodyTimeline: React.FC<CustodyTimelineProps> = ({ events }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded">
        <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>FORENSIC CUSTODY STATE: CUSTODY CHAIN VALID</span>
        </div>
        <Badge variant="success">100% Cryptographic Match</Badge>
      </div>

      <div className="relative border-l-2 border-slate-300 pl-6 space-y-4 my-2">
        {events.map((evt) => (
          <div key={evt.id} className="relative">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-700" />
            </div>

            <div className="p-4 rounded border border-slate-200 bg-white space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-xs">
                  Sequence #{evt.sequence} — {evt.eventType}
                </span>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium pt-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Actor: <strong className="text-slate-900">{evt.actor}</strong> ({evt.organization})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Location: <strong className="text-slate-900">{evt.location}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500">Transfer ID: {evt.transferId}</span>
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-700 flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-slate-400" />
                  Event Hash: {evt.eventHash}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
