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
        <div className="p-3 bg-[#A66A00]/10 border border-[#A66A00]/30 rounded-md text-[#A66A00] font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#A66A00] shrink-0" />
          <span>CRYPTOGRAPHIC DELTA: SHA-256 digest modified between v{v1.version} and v{v2.version}. Revision recorded in append-only audit trail.</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-[#DCE3EA] rounded-md bg-[#F6F8FB] space-y-2">
            <div className="flex items-center justify-between border-b border-[#DCE3EA] pb-2">
              <span className="font-bold text-[#17212B] text-sm">Version {v1.version}</span>
              <Badge variant="neutral">Previous Revision</Badge>
            </div>
            <div><span className="font-bold text-[#5B6875]">Date:</span> <span className="text-[#17212B]">{v1.date}</span></div>
            <div><span className="font-bold text-[#5B6875]">File Size:</span> <span className="text-[#17212B]">{v1.size}</span></div>
            <div>
              <div className="font-bold text-[#5B6875] text-[10px] uppercase tracking-wider">SHA-256 Digest</div>
              <div className="font-mono text-[11px] font-bold text-[#17212B] bg-white p-2 border border-[#DCE3EA] rounded-md mt-1 break-all">
                {v1.sha256}
              </div>
            </div>
          </div>

          <div className="p-4 border border-[#18794E]/30 rounded-md bg-[#18794E]/10 space-y-2">
            <div className="flex items-center justify-between border-b border-[#18794E]/20 pb-2">
              <span className="font-bold text-[#18794E] text-sm">Version {v2.version}</span>
              <Badge variant="success">Active Revision</Badge>
            </div>
            <div><span className="font-bold text-[#5B6875]">Date:</span> <span className="text-[#17212B]">{v2.date}</span></div>
            <div><span className="font-bold text-[#5B6875]">File Size:</span> <span className="text-[#17212B]">{v2.size}</span></div>
            <div>
              <div className="font-bold text-[#5B6875] text-[10px] uppercase tracking-wider">SHA-256 Digest</div>
              <div className="font-mono text-[11px] font-bold text-[#18794E] bg-white p-2 border border-[#18794E]/30 rounded-md mt-1 break-all">
                {v2.sha256}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
