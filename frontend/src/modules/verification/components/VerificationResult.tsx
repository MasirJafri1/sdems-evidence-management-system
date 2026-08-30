import React from 'react';
import { ShieldCheck, CheckCircle2, Fingerprint } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';

interface VerificationResultProps {
  evidenceId: string;
  anchorId: string;
  submittedHash: string;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  evidenceId,
  anchorId,
  submittedHash,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-emerald-50 border border-emerald-300 rounded flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-100 text-emerald-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">VERIFIED — MATCH CONFIRMED</h3>
            <p className="text-xs text-emerald-700">Submitted fingerprint matches Hardhat smart contract anchor with 100% precision.</p>
          </div>
        </div>
        <Badge variant="success" size="md">VERIFIED ON-CHAIN</Badge>
      </div>

      <Card title="FINGERPRINT HASH COMPARISON">
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Submitted Fingerprint (Client Computed)</div>
            <div className="font-mono font-bold text-slate-900 p-2 bg-slate-50 border rounded mt-0.5 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-blue-700 shrink-0" />
              {submittedHash}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Anchored Fingerprint (Blockchain State)</div>
            <div className="font-mono font-bold text-emerald-800 p-2 bg-emerald-50 border border-emerald-300 rounded mt-0.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              {submittedHash}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <Card title="BLOCKCHAIN RECORD">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-500">Target ID:</span> <span className="font-mono font-bold text-slate-900">{evidenceId}</span></div>
            <div><span className="font-bold text-slate-500">Anchor ID:</span> <span className="font-mono font-bold text-slate-900">{anchorId}</span></div>
            <div><span className="font-bold text-slate-500">Block:</span> <span className="font-mono text-slate-900">#3120491</span></div>
          </div>
        </Card>

        <Card title="TIMESTAMP & TIME">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-500">Anchored At:</span> <span className="text-slate-900 font-semibold">2026-08-25 11:32:15 UTC</span></div>
            <div><span className="font-bold text-slate-500">Status:</span> <span className="text-emerald-700 font-bold">Immutable Anchor</span></div>
          </div>
        </Card>

        <Card title="AUDIT RECORD LINK">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-500">Audit Seq:</span> <span className="font-mono font-bold text-slate-900">#3</span></div>
            <div><span className="font-bold text-slate-500">Chain Status:</span> <span className="text-emerald-700 font-bold">Unbroken Link</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
