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
      <div className="flex items-center justify-between p-3 bg-[#E6F4ED] border border-[#B2DDCE] rounded-md">
        <div className="flex items-center gap-2 font-bold text-xs text-[#18794E]">
          <ShieldCheck className="w-4 h-4 text-[#18794E]" />
          <span>FORENSIC CUSTODY STATE: CUSTODY CHAIN VERIFIED & VALID</span>
        </div>
        <Badge variant="success">100% Cryptographic Match</Badge>
      </div>

      <div className="relative border-l-2 border-[#DCE3EA] pl-6 space-y-4 my-2">
        {events.map((evt) => (
          <div key={evt.id} className="relative">
            {/* Timeline Connector Dot */}
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#123B63] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#123B63]" />
            </div>

            <div className="p-4 rounded-md border border-[#DCE3EA] bg-white space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#DCE3EA] pb-2">
                <span className="font-mono font-bold text-[#123B63] text-xs uppercase tracking-wide">
                  Sequence #{evt.sequence} — {evt.eventType}
                </span>
                <span className="text-[11px] text-[#5B6875] font-medium flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-[#5B6875]" />
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#17212B] font-medium pt-0.5">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#2F6B95] shrink-0" />
                  <span>Actor: <strong className="text-[#123B63]">{evt.actor}</strong> ({evt.organization})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2F6B95] shrink-0" />
                  <span>Location: <strong className="text-[#17212B]">{evt.location}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCE3EA] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                <span className="text-[#5B6875]">Transfer Ref: <strong className="text-[#123B63]">{evt.transferId}</strong></span>
                <span className="bg-[#F6F8FB] px-2.5 py-0.5 rounded border border-[#DCE3EA] text-[#17212B] flex items-center gap-1 font-semibold">
                  <Fingerprint className="w-3 h-3 text-[#2F6B95]" />
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
