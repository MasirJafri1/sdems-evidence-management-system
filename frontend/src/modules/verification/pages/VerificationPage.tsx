import React, { useState } from 'react';
import { VerificationForm } from '../components/VerificationForm';
import { VerificationResult } from '../components/VerificationResult';
import { Card } from '../../../components/ui/Card';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<{
    evidenceId: string;
    anchorId: string;
    submittedHash: string;
  } | null>(null);

  const handleVerify = (
    evidenceId: string,
    anchorId: string,
    contentHash: string
  ) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResultData({
        evidenceId,
        anchorId,
        submittedHash: contentHash,
      });
    }, 600);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-slate-900" />
          Independent Evidence Verification Tool
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Public-sector cryptographic verification interface for judicial authorities and forensic auditors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card title="EVIDENCE INTEGRITY QUERY" subtitle="Can this evidence be trusted?">
            <VerificationForm onVerify={handleVerify} isLoading={isLoading} />
          </Card>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              How Verification Works
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              This tool re-computes the SHA-256 fingerprint digest of the target file binary and performs a direct zero-trust RPC read against Hardhat smart contract <code className="font-mono bg-white px-1 py-0.5 border rounded">EvidenceRegistry.sol</code>.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {resultData ? (
            <VerificationResult
              evidenceId={resultData.evidenceId}
              anchorId={resultData.anchorId}
              submittedHash={resultData.submittedHash}
            />
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-300 rounded bg-slate-50 p-8 space-y-2">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Query Executed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the Evidence ID, Anchor ID, and SHA-256 fingerprint hash on the left form to execute instant cryptographic proof verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
