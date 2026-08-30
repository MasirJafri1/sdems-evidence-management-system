import React, { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck } from 'lucide-react';

interface VerificationFormProps {
  onVerify: (evidenceId: string, anchorId: string, contentHash: string) => void;
  isLoading: boolean;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  onVerify,
  isLoading,
}) => {
  const [evidenceId, setEvidenceId] = useState('doc-001');
  const [anchorId, setAnchorId] = useState('ANCHOR-0x98124A');
  const [contentHash, setContentHash] = useState(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(evidenceId, anchorId, contentHash);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Document / Evidence ID"
        placeholder="e.g. doc-001 or EVID-2026-9041"
        value={evidenceId}
        onChange={(e) => setEvidenceId(e.target.value)}
        required
      />

      <Input
        label="Blockchain Anchor ID"
        placeholder="e.g. ANCHOR-0x98124A"
        value={anchorId}
        onChange={(e) => setAnchorId(e.target.value)}
        required
      />

      <Input
        label="SHA-256 Content Fingerprint Hash"
        placeholder="64-character SHA-256 digest string"
        value={contentHash}
        onChange={(e) => setContentHash(e.target.value)}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
      >
        Execute Cryptographic Verification
      </Button>
    </form>
  );
};
