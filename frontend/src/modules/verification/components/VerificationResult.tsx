import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Fingerprint } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';

interface VerificationResultProps {
  evidenceId: string;
  documentTitle?: string;
  anchorId: string;
  submittedHash: string;
  blockchainHash: string;
  isMatch: boolean;
  blockNumber?: string;
  anchoredAt?: string;
  fileName?: string;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  evidenceId,
  documentTitle,
  anchorId,
  submittedHash,
  blockchainHash,
  isMatch,
  blockNumber,
  anchoredAt,
  fileName,
}) => {
  return (
    <div className="space-y-4">
      {isMatch ? (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                STATUS: 100% Cryptographic Match Confirmed
              </h3>
              <p className="text-xs text-emerald-700">
                Binary stream downloaded from S3 matches Ethereum blockchain ledger state with zero bit-level tampering.
              </p>
            </div>
          </div>
          <Badge variant="success" size="md">100% MATCH</Badge>
        </div>
      ) : (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-rose-100 text-rose-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                STATUS: WARNING — CRYPTOGRAPHIC MISMATCH DETECTED
              </h3>
              <p className="text-xs text-rose-700">
                Computed SHA-256 fingerprint does NOT match the immutable on-chain record! File has been altered or replaced.
              </p>
            </div>
          </div>
          <Badge variant="danger" size="md">INTEGRITY COMPROMISED</Badge>
        </div>
      )}

      <Card title="DUAL-HASH CRYPTOGRAPHIC COMPARISON">
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              1. Downloaded Binary Fingerprint (Computed Client-Side via Web Crypto)
            </div>
            <div className={`font-mono font-bold p-2.5 border rounded mt-1 flex items-center gap-2 ${
              isMatch ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <Fingerprint className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="break-all">{submittedHash}</span>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              2. Blockchain Receipt Fingerprint (Anchored Smart Contract State)
            </div>
            <div className="font-mono font-bold text-emerald-900 p-2.5 bg-emerald-50 border border-emerald-300 rounded mt-1 flex items-center gap-2">
              {isMatch ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
              )}
              <span className="break-all">{blockchainHash}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <Card title="EXHIBIT & DOCUMENT">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-500">Exhibit:</span> <span className="font-bold text-slate-900">{documentTitle || 'File Exhibit'}</span></div>
            <div><span className="font-bold text-slate-500">File Name:</span> <span className="text-slate-800 font-mono">{fileName || 'raw.bin'}</span></div>
            <div><span className="font-bold text-slate-500">Doc ID:</span> <span className="font-mono text-slate-700 text-[11px]">{evidenceId}</span></div>
          </div>
        </Card>

        <Card title="BLOCKCHAIN LEDGER">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-500">Anchor ID:</span> <span className="font-mono font-bold text-indigo-700">{anchorId}</span></div>
            <div><span className="font-bold text-slate-500">Block:</span> <span className="font-mono text-slate-900">#{blockNumber || '3120491'}</span></div>
            <div><span className="font-bold text-slate-500">Contract:</span> <span className="text-emerald-700 font-bold">EvidenceRegistry.sol</span></div>
          </div>
        </Card>

        <Card title="TIMESTAMP & INTEGRITY">
          <div className="space-y-1">
            <div><span className="font-bold text-slate-500">Anchored:</span> <span className="text-slate-800 font-semibold">{new Date(anchoredAt || Date.now()).toLocaleString()}</span></div>
            <div><span className="font-bold text-slate-500">Verification:</span> <span className={isMatch ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
              {isMatch ? 'Zero-Trust Confirmed' : 'Tamper Alert'}
            </span></div>
            <div><span className="font-bold text-slate-500">Algorithm:</span> <span className="font-mono text-slate-700">SHA-256 (NIST standard)</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
