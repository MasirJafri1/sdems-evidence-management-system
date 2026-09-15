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
        <div className="p-4 bg-[#E6F4ED] border border-[#B2DDCE] rounded-md flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white border border-[#B2DDCE] text-[#18794E]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#18794E] uppercase tracking-wider">
                STATUS: 100% Cryptographic Match Confirmed
              </h3>
              <p className="text-xs text-[#18794E] font-medium mt-0.5">
                Binary stream matches the anchored Ethereum blockchain ledger state with zero bit-level tampering.
              </p>
            </div>
          </div>
          <Badge variant="success" size="md">100% MATCH</Badge>
        </div>
      ) : (
        <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-md flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white border border-[#FECDCA] text-[#B42318]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#B42318] uppercase tracking-wider">
                STATUS: WARNING — CRYPTOGRAPHIC MISMATCH DETECTED
              </h3>
              <p className="text-xs text-[#B42318] font-medium mt-0.5">
                Computed SHA-256 fingerprint does NOT match the immutable on-chain record! File has been altered or replaced.
              </p>
            </div>
          </div>
          <Badge variant="danger" size="md">INTEGRITY COMPROMISED</Badge>
        </div>
      )}

      <Card title="DUAL-HASH CRYPTOGRAPHIC COMPARISON" subtitle="Client-side WebCrypto digest vs. anchored blockchain receipt">
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">
              1. Downloaded Binary Fingerprint (Computed Client-Side via Web Crypto API)
            </div>
            <div className={`font-mono font-bold p-2.5 border rounded-md mt-1 flex items-center gap-2 ${
              isMatch ? 'bg-[#F6F8FB] border-[#DCE3EA] text-[#17212B]' : 'bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]'
            }`}>
              <Fingerprint className="w-4 h-4 text-[#2F6B95] shrink-0" />
              <span className="break-all">{submittedHash}</span>
            </div>
          </div>

          <div>
            <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">
              2. Blockchain Receipt Fingerprint (Anchored Smart Contract State)
            </div>
            <div className="font-mono font-bold text-[#18794E] p-2.5 bg-[#E6F4ED] border border-[#B2DDCE] rounded-md mt-1 flex items-center gap-2">
              {isMatch ? (
                <CheckCircle2 className="w-4 h-4 text-[#18794E] shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-[#B42318] shrink-0" />
              )}
              <span className="break-all">{blockchainHash}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <Card title="EXHIBIT & DOCUMENT">
          <div className="space-y-1.5 text-xs">
            <div><span className="font-bold text-[#5B6875]">Exhibit Title:</span> <span className="font-bold text-[#123B63] block truncate">{documentTitle || 'File Exhibit'}</span></div>
            <div><span className="font-bold text-[#5B6875]">File Name:</span> <span className="text-[#17212B] font-mono text-[11px] block truncate">{fileName || 'raw.bin'}</span></div>
            <div><span className="font-bold text-[#5B6875]">Doc ID:</span> <span className="font-mono text-[#2F6B95] text-[11px] block">{evidenceId}</span></div>
          </div>
        </Card>

        <Card title="BLOCKCHAIN LEDGER">
          <div className="space-y-1.5 text-xs">
            <div><span className="font-bold text-[#5B6875]">Anchor Receipt:</span> <span className="font-mono font-bold text-[#123B63] block truncate">{anchorId}</span></div>
            <div><span className="font-bold text-[#5B6875]">Block Number:</span> <span className="font-mono text-[#17212B] block">#{blockNumber || '3120491'}</span></div>
            <div><span className="font-bold text-[#5B6875]">Smart Contract:</span> <span className="text-[#18794E] font-bold block">EvidenceRegistry.sol</span></div>
          </div>
        </Card>

        <Card title="TIMESTAMP & INTEGRITY">
          <div className="space-y-1.5 text-xs">
            <div><span className="font-bold text-[#5B6875]">Anchored At:</span> <span className="text-[#17212B] font-semibold block">{new Date(anchoredAt || Date.now()).toLocaleString()}</span></div>
            <div><span className="font-bold text-[#5B6875]">Verification:</span> <span className={isMatch ? "text-[#18794E] font-bold block" : "text-[#B42318] font-bold block"}>
              {isMatch ? 'Zero-Trust Confirmed' : 'Tamper Alert'}
            </span></div>
            <div><span className="font-bold text-[#5B6875]">Algorithm:</span> <span className="font-mono text-[#5B6875] block">SHA-256 (NIST standard)</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
};
