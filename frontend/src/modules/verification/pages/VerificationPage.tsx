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
      <div className="border-b border-[#DCE3EA] pb-4">
        <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#123B63]" />
          Independent Evidence Verification Portal
        </h1>
        <p className="text-xs text-[#5B6875] mt-0.5">
          Public-sector cryptographic verification interface for judicial authorities, forensic investigators, and government auditors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card title="EVIDENCE INTEGRITY QUERY" subtitle="Can this evidence be trusted in court?">
            <VerificationForm
              onVerify={handleVerify}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </Card>

          <div className="p-4 bg-white border border-[#DCE3EA] rounded-md text-xs space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-[#123B63]">
              <HelpCircle className="w-4 h-4 text-[#2F6B95]" />
              How Dual-Hash Verification Works
            </div>
            <p className="text-[#5B6875] leading-relaxed text-[11px]">
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
            <div className="py-20 text-center border border-dashed border-[#DCE3EA] rounded-md bg-white p-8 space-y-2 shadow-2xs">
              <ShieldCheck className="w-12 h-12 text-[#5B6875]/40 mx-auto" />
              <h3 className="text-sm font-bold text-[#123B63]">No Verification Executed</h3>
              <p className="text-xs text-[#5B6875] max-w-sm mx-auto">
                Select an uploaded case document or choose a local binary file on the left to execute instant cryptographic proof verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
