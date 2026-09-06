import React, { useState } from 'react';
import { VerificationForm } from '../components/VerificationForm';
import { VerificationResult } from '../components/VerificationResult';
import { Card } from '../../../components/ui/Card';
import { ShieldCheck, HelpCircle } from 'lucide-react';

interface VerifiedPayload {
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

export const VerificationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<VerifiedPayload | null>(null);

  const handleVerify = (data: VerifiedPayload) => {
    setResultData(data);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          Independent Evidence Verification Tool
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Public-sector cryptographic verification interface for judicial authorities and forensic auditors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card title="EVIDENCE INTEGRITY QUERY" subtitle="Can this evidence be trusted?">
            <VerificationForm
              onVerify={handleVerify}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </Card>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              How Dual-Hash Verification Works
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              This tool re-computes the raw SHA-256 fingerprint digest of the target file binary directly on your machine using the browser's Web Crypto API, then validates it against the Ethereum smart contract receipt anchored at seizure time.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {resultData ? (
            <VerificationResult
              evidenceId={resultData.evidenceId}
              documentTitle={resultData.documentTitle}
              anchorId={resultData.anchorId}
              submittedHash={resultData.submittedHash}
              blockchainHash={resultData.blockchainHash}
              isMatch={resultData.isMatch}
              blockNumber={resultData.blockNumber}
              anchoredAt={resultData.anchoredAt}
              fileName={resultData.fileName}
            />
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-300 rounded bg-slate-50 p-8 space-y-2">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Query Executed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an uploaded case document or choose a local binary on the left to execute instant cryptographic proof verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
