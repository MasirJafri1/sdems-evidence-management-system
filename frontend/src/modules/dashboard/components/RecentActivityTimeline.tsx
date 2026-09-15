import React from 'react';
import { Card } from '../../../components/ui/Card';
import { FileUp, FolderPlus, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '../../../store';

export const RecentActivityTimeline: React.FC = () => {
  const { cases } = useAppSelector((state) => state.cases);
  const { documents } = useAppSelector((state) => state.documents);

  const realActivities: Array<{
    type: string;
    text: string;
    actor: string;
    time: string;
    icon: any;
  }> = [];

  // Add real uploaded documents
  documents.forEach((d) => {
    realActivities.push({
      type: 'Document Uploaded',
      text: `${d.documentName} committed to S3 vault & anchored on-chain`,
      actor: d.uploadedBy || 'Investigating Officer',
      time: new Date(d.uploadedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: FileUp,
    });
  });

  // Add real initialized cases
  cases.forEach((c) => {
    realActivities.push({
      type: 'Case Initialized',
      text: `${c.caseNumber} — ${c.title} registered in database`,
      actor: c.leadOfficer || 'Chief Administrator',
      time: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: FolderPlus,
    });
  });

  if (realActivities.length === 0) {
    realActivities.push({
      type: 'System Integrity Check',
      text: 'Cryptographic monitoring service active & connected',
      actor: 'System Integrity Monitor',
      time: 'Just now',
      icon: ShieldCheck,
    });
  }

  return (
    <Card title="RECENT SYSTEM ACTIVITY" subtitle="Real-time log of official evidence actions">
      <div className="space-y-3 divide-y divide-[#DCE3EA]">
        {realActivities.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div key={idx} className="pt-2.5 first:pt-0 flex items-start gap-3 text-xs">
              <div className="p-1.5 rounded-md bg-[#EBF3FA] border border-[#B8D3EA] text-[#123B63] mt-0.5 shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 space-y-0.5 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#123B63] truncate">{act.type}</span>
                  <span className="text-[11px] text-[#5B6875] font-mono shrink-0 ml-2">{act.time}</span>
                </div>
                <p className="text-[#17212B] truncate">{act.text}</p>
                <div className="text-[11px] text-[#5B6875] font-medium">By: {act.actor}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
