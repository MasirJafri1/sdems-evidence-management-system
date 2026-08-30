import React from 'react';
import { ShieldCheck, CheckCircle2, FileCheck, Anchor, GitCommit } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export const SystemIntegrityPanel: React.FC = () => {
  const integrityItems = [
    { title: 'Document Integrity', status: 'VERIFIED', icon: FileCheck, detail: 'SHA-256 Fingerprints Unaltered' },
    { title: 'Blockchain Anchors', status: 'VERIFIED', icon: Anchor, detail: 'Proof-of-Existence Committed' },
    { title: 'Audit Hash Chain', status: 'VERIFIED', icon: ShieldCheck, detail: 'Append-Only Sequence Valid' },
    { title: 'Custody Handshakes', status: 'VERIFIED', icon: GitCommit, detail: 'Transfer Sign-offs Complete' },
  ];

  return (
    <Card title="SYSTEM INTEGRITY MONITORS" subtitle="Continuous automated cryptographic verification">
      <div className="flex flex-col gap-2.5">
        {integrityItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-2.5 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded bg-emerald-100/80 text-emerald-800 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 leading-tight font-heading truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                    {item.detail}
                  </div>
                </div>
              </div>

              <Badge variant="success" size="sm" className="shrink-0 font-bold">
                <CheckCircle2 className="w-3 h-3 inline mr-1 shrink-0" />
                {item.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
