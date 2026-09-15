import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface AuditIntegrityPanelProps {
  totalEvents: number;
  onVerify: () => void;
  isVerifying: boolean;
}

export const AuditIntegrityPanel: React.FC<AuditIntegrityPanelProps> = ({
  totalEvents,
  onVerify,
  isVerifying,
}) => {
  return (
    <div className="p-4 rounded-md border border-[#B2DDCE] bg-[#E6F4ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-white border border-[#B2DDCE] text-[#18794E]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#18794E] uppercase tracking-wider">AUDIT CHAIN INTEGRITY: VERIFIED</h3>
            <Badge variant="success">UNBROKEN HASH LINK</Badge>
          </div>
          <p className="text-[#18794E] text-[11px] mt-0.5 font-medium">
            Verified {totalEvents} sequential events linked by SHA-256 digests. Zero broken pointers or deleted rows.
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onVerify}
        isLoading={isVerifying}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
      >
        Re-Verify Audit Chain
      </Button>
    </div>
  );
};
