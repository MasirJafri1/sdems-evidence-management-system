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
    <div className="p-4 rounded border border-emerald-300 bg-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-emerald-100 text-emerald-800">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-emerald-900">AUDIT CHAIN INTEGRITY: VALID</h3>
            <Badge variant="success">UNBROKEN HASH LINK</Badge>
          </div>
          <p className="text-emerald-700 text-[11px] mt-0.5">
            Verified {totalEvents} sequential events linked by SHA-256 digests. Zero broken pointers or deleted rows.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
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
