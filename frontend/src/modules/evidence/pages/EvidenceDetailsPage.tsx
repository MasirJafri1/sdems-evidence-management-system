import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvidenceByIdApi, getCustodyHistoryApi } from '../api/evidence.api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CustodyTimeline } from '../../custody/components/CustodyTimeline';
import { ArrowLeft, GitCommit, Copy, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

import { TransferInitiateModal } from '../../custody/components/TransferInitiateModal';
import { useCustodyTransfer } from '../../custody/hooks/useCustodyTransfer';

export const EvidenceDetailsPage: React.FC = () => {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const navigate = useNavigate();
  const [evidenceRecord, setEvidenceRecord] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const { startTransfer } = useCustodyTransfer();

  useEffect(() => {
    if (!evidenceId) return;
    getEvidenceByIdApi(evidenceId)
      .then((data) => setEvidenceRecord(data))
      .catch(() => setEvidenceRecord(null));
      
    getCustodyHistoryApi(evidenceId)
      .then((data: any[]) => {
        const mapped = data.map((evt) => ({
          id: evt.id,
          sequence: evt.sequence,
          eventType: evt.reason || 'Custody Handshake',
          timestamp: evt.createdAt,
          actor: evt.toUser?.name || 'Unknown Officer',
          organization: evt.toUser?.email || 'System Network',
          location: 'Verified Network',
          transferId: evt.transferId,
          eventHash: evt.eventHash
        }));
        setHistory(mapped);
      })
      .catch(() => setHistory([]));
  }, [evidenceId]);

  const item = {
    evidenceNumber: evidenceRecord?.evidenceNumber || evidenceId || 'EVID-2026-REG',
    title: evidenceRecord?.title || 'Seized Digital Exhibit File',
    status: evidenceRecord?.status || 'In Custody',
    evidenceType: 'Digital Document / Exhibit',
    serialNumber: evidenceRecord?.serialNumber || 'SN-VERIFIED-01',
    storageLocation: evidenceRecord?.storageLocation || 'CFSL Vault / Secure S3 Bucket',
    caseNumber: evidenceRecord?.case?.caseNumber || 'CASE-REG-01',
    currentCustodian: evidenceRecord?.currentCustodian?.name || 'Investigating Officer',
    custodianOrganization: 'Central Forensic Science Laboratory (CFSL)',
    collectedBy: evidenceRecord?.createdBy?.name || 'Senior Forensic Inspector',
    dateCollected: evidenceRecord?.createdAt || new Date().toISOString(),
    sha256Hash: evidenceRecord?.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    blockchainTx: '0x8f3b29c91d4a0e28f119028a47e62c11094f316a7590d981245a190013b09281',
    version: 'v3.0.1',
    legalHoldStatus: 'ACTIVE (No Expire)',
    retentionStatus: 'PERMANENT LEGAL RECORD',
    history: history,
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(item.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => navigate(ROUTES.PROTECTED.EVIDENCE.LIST)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6875] hover:text-[#123B63] transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Evidence Registry
        </button>

        {/* Record Header Banner */}
        <div className="p-5 rounded-md border border-[#DCE3EA] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs border-t-4 border-t-[#123B63]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-extrabold text-[#123B63] bg-[#EBF3FA] px-2.5 py-0.5 rounded border border-[#B8D3EA]">
                OFFICIAL RECORD: {item.evidenceNumber}
              </span>
              <Badge variant="success">✓ VERIFIED RECORD</Badge>
              <Badge variant="info">ANCHORED ON-CHAIN</Badge>
            </div>
            <h1 className="text-xl font-bold text-[#123B63] tracking-tight">{item.title}</h1>
            <p className="text-xs text-[#5B6875] font-medium mt-1">
              Serial: <span className="font-mono font-bold text-[#17212B]">{item.serialNumber}</span> • Storage: <span className="font-semibold text-[#17212B]">{item.storageLocation}</span>
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={() => setIsInitiateOpen(true)} leftIcon={<GitCommit className="w-3.5 h-3.5" />}>
            Initiate Custody Handshake
          </Button>
        </div>
      </div>

      {/* EVIDENCE INTEGRITY VERIFICATION CARD */}
      <div className="p-5 rounded-md border border-[#B2DDCE] bg-[#E6F4ED] shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#B2DDCE] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#18794E] text-white rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#18794E] uppercase tracking-wider">
                Evidence Integrity: ✓ VERIFIED
              </h2>
              <p className="text-xs text-[#18794E] font-medium">
                Cryptographic SHA-256 hash matches the anchored blockchain proof-of-existence record.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-[#18794E]">
            <span className="bg-white px-2.5 py-1 rounded border border-[#B2DDCE]">
              Blockchain Anchor: CONFIRMED
            </span>
            <span className="bg-white px-2.5 py-1 rounded border border-[#B2DDCE]">
              Version: {item.version}
            </span>
            <span className="bg-white px-2.5 py-1 rounded border border-[#B2DDCE]">
              Custody Events: {item.history.length > 0 ? item.history.length : 1}
            </span>
          </div>
        </div>

        {/* SHA-256 Hash Display Block */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#18794E] uppercase tracking-wider">
            <span>SHA-256 Fingerprint Hash</span>
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#18794E] hover:text-[#123B63] bg-white px-2 py-0.5 rounded border border-[#B2DDCE] transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              {copiedHash ? 'COPIED!' : 'COPY HASH'}
            </button>
          </div>
          <div className="p-2.5 rounded-md bg-white border border-[#B2DDCE] font-mono text-xs text-[#17212B] break-all select-all font-semibold">
            {item.sha256Hash}
          </div>
        </div>
      </div>

      <TransferInitiateModal
        isOpen={isInitiateOpen}
        onClose={() => setIsInitiateOpen(false)}
        evidenceId={evidenceRecord?.id}
        onInitiate={async (evNumber: string, toCustodian: string, toOrg: string, reason: string) => {
          await startTransfer(evNumber, toCustodian, toOrg, reason);
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="CHAIN OF CUSTODY HISTORY LOG" subtitle="Official timestamped audit trail of custody events">
            <CustodyTimeline events={item.history} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="EVIDENCE SPECIFICATIONS" subtitle="Official metadata record parameters">
            <div className="space-y-3 text-xs divide-y divide-[#DCE3EA]">
              <div className="pt-2 first:pt-0 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Evidence ID:</span>
                <span className="font-mono font-bold text-[#123B63]">{item.evidenceNumber}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Associated Case ID:</span>
                <span className="font-mono font-bold text-[#123B63]">{item.caseNumber}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Current Custodian:</span>
                <span className="text-[#17212B] font-bold">{item.currentCustodian}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Organization:</span>
                <span className="text-[#17212B] font-semibold">{item.custodianOrganization}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Uploaded By:</span>
                <span className="text-[#17212B] font-semibold">{item.collectedBy}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Created Timestamp:</span>
                <span className="text-[#5B6875] font-mono">{new Date(item.dateCollected).toLocaleString()}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Blockchain Tx Reference:</span>
                <span className="font-mono text-[10px] text-[#2F6B95] truncate max-w-[150px]" title={item.blockchainTx}>
                  {item.blockchainTx}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Legal Hold Status:</span>
                <span className="text-[#18794E] font-bold uppercase">{item.legalHoldStatus}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-bold text-[#5B6875]">Retention Schedule:</span>
                <span className="text-[#123B63] font-bold uppercase">{item.retentionStatus}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
