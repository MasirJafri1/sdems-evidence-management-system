import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { AlertTriangle } from 'lucide-react';

interface VersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  v1: { version: string; sha256: string; date: string; size: string };
  v2: { version: string; sha256: string; date: string; size: string };
}

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  isOpen,
  onClose,
  v1,
  v2,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Side-by-Side Version Hash Delta Inspector" maxWidth="xl">
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>CRYPTOGRAPHIC DELTA: SHA-256 digest modified between v{v1.version} and v{v2.version}. Revision recorded in append-only audit trail.</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded bg-slate-50 space-y-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">Version {v1.version}</span>
              <Badge variant="neutral">Previous Revision</Badge>
            </div>
            <div><span className="font-bold text-slate-500">Date:</span> <span className="text-slate-900">{v1.date}</span></div>
            <div><span className="font-bold text-slate-500">File Size:</span> <span className="text-slate-900">{v1.size}</span></div>
            <div>
              <div className="font-bold text-slate-500 text-[10px] uppercase">SHA-256 Digest</div>
              <div className="font-mono text-[11px] font-bold text-slate-900 bg-white p-2 border rounded mt-1 break-all">
                {v1.sha256}
              </div>
            </div>
          </div>

          <div className="p-4 border border-emerald-300 rounded bg-emerald-50/50 space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-bold text-slate-900 text-sm">Version {v2.version}</span>
              <Badge variant="success">Active Revision</Badge>
            </div>
            <div><span className="font-bold text-slate-500">Date:</span> <span className="text-slate-900">{v2.date}</span></div>
            <div><span className="font-bold text-slate-500">File Size:</span> <span className="text-slate-900">{v2.size}</span></div>
            <div>
              <div className="font-bold text-slate-500 text-[10px] uppercase">SHA-256 Digest</div>
              <div className="font-mono text-[11px] font-bold text-emerald-900 bg-white p-2 border border-emerald-300 rounded mt-1 break-all">
                {v2.sha256}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
