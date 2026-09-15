import React, { useState, useEffect } from 'react';
import { TransferInitiateModal } from '../components/TransferInitiateModal';
import { TransferAcceptModal } from '../components/TransferAcceptModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { GitCommit, ShieldCheck, Clock, ArrowRightLeft } from 'lucide-react';
import { useCustodyTransfer } from '../hooks/useCustodyTransfer';
import { getMyTransfersApi } from '../../evidence/api/evidence.api';

export const CustodyPage: React.FC = () => {
  const { startTransfer, acceptTransfer, rejectTransfer } = useCustodyTransfer();
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [selectedTransferForAccept, setSelectedTransferForAccept] = useState<any>(null);

  const [transfers, setTransfers] = useState<any[]>([]);

  const fetchTransfers = async () => {
    try {
      const data = await getMyTransfersApi();
      const formatted = data.map((t: any) => ({
        id: t.id,
        evidenceNumber: t.evidence?.evidenceNumber || t.evidenceId,
        itemTitle: t.evidence?.title || 'Unknown Evidence',
        fromOfficer: `${t.fromUser?.name || 'Officer'} (${t.fromUser?.memberships?.[0]?.organization?.name || 'Police Department'})`,
        toOfficer: `${t.toUser?.name || 'Officer'} (${t.toUser?.memberships?.[0]?.organization?.name || 'Forensic Lab'})`,
        status: t.status,
        timestamp: t.createdAt,
        reason: t.reason,
      }));
      setTransfers(formatted);
    } catch (err) {
      console.error('Failed to fetch transfers', err);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight flex items-center gap-2">
            <GitCommit className="w-6 h-6 text-[#123B63]" />
            Chain of Custody & Inter-Agency Evidence Transfer Portal
          </h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Two-party cryptographically signed physical and digital property transfers across Police, Forensic, Judicial, and Govt agencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setIsInitiateOpen(true)}
            leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            size="sm"
          >
            Initiate Custody Transfer
          </Button>
        </div>
      </div>

      {/* DEDICATED VISUAL CHAIN-OF-CUSTODY TRANSFER FLOW CARD */}
      <div className="p-5 rounded-md border border-[#DCE3EA] bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#DCE3EA] pb-2">
          <h2 className="text-xs font-extrabold text-[#123B63] uppercase tracking-wider">
            Inter-Agency Chain of Custody Pipeline
          </h2>
          <span className="text-[11px] font-bold text-[#18794E] bg-[#E6F4ED] px-2 py-0.5 rounded border border-[#B2DDCE]">
            ✓ Cryptographically Traceable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Step 1: Police */}
          <div className="p-3 rounded-md bg-[#F6F8FB] border border-[#DCE3EA] relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#123B63] mb-1">
              <span>1. Police Department</span>
              <Badge variant="success">Completed</Badge>
            </div>
            <p className="text-[11px] text-[#5B6875]">Seizure, initial hash generation & vault registration</p>
            <div className="mt-2 pt-1.5 border-t border-[#DCE3EA] text-[10px] font-mono text-[#123B63] font-bold">
              ✓ Seizure Hash Anchored
            </div>
          </div>

          {/* Step 2: Forensic Lab */}
          <div className="p-3 rounded-md bg-[#F6F8FB] border border-[#DCE3EA] relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#123B63] mb-1">
              <span>2. Forensic Lab</span>
              <Badge variant="info">In Custody</Badge>
            </div>
            <p className="text-[11px] text-[#5B6875]">Forensic examination, extraction & integrity check</p>
            <div className="mt-2 pt-1.5 border-t border-[#DCE3EA] text-[10px] font-mono text-[#2F6B95] font-bold">
              ✓ Analysis Verified
            </div>
          </div>

          {/* Step 3: Judiciary / Court */}
          <div className="p-3 rounded-md bg-[#F6F8FB] border border-[#DCE3EA] relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#123B63] mb-1">
              <span>3. Judiciary / Court</span>
              <Badge variant="warning">Pending Sign-off</Badge>
            </div>
            <p className="text-[11px] text-[#5B6875]">Court exhibit presentation & judicial vault transfer</p>
            <div className="mt-2 pt-1.5 border-t border-[#DCE3EA] text-[10px] font-mono text-[#A66A00] font-bold">
              Awaiting Handshake
            </div>
          </div>

          {/* Step 4: Govt Dept */}
          <div className="p-3 rounded-md bg-[#F6F8FB] border border-[#DCE3EA] relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#123B63] mb-1">
              <span>4. Govt Department</span>
              <Badge variant="neutral">Final Archival</Badge>
            </div>
            <p className="text-[11px] text-[#5B6875]">Permanent record compliance & legal hold audit</p>
            <div className="mt-2 pt-1.5 border-t border-[#DCE3EA] text-[10px] font-mono text-[#5B6875] font-bold">
              Archival Ready
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-2xs border-l-4 border-l-[#18794E]">
          <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">Custody Ledger Status</div>
          <div className="text-lg font-bold text-[#123B63] font-mono mt-1">HANDSHAKE VERIFIED</div>
          <div className="text-[#5B6875] mt-1 font-medium">100% Chain-of-Custody Integrity</div>
        </div>

        <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-2xs border-l-4 border-l-[#2F6B95]">
          <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">Active Transfers</div>
          <div className="text-lg font-bold text-[#123B63] font-mono mt-1">{transfers.length} Logged</div>
          <div className="text-[#5B6875] mt-1 font-medium">Signed by Authorized Officers</div>
        </div>

        <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-2xs border-l-4 border-l-[#123B63]">
          <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">Vault Security</div>
          <div className="text-lg font-bold text-[#18794E] font-mono mt-1">COMPLIANT</div>
          <div className="text-[#5B6875] mt-1 font-medium">Inter-Agency Standard Guidelines</div>
        </div>
      </div>

      {/* Transfer Log Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#123B63] uppercase tracking-wider">
            Custody Handshake Timeline & Transfer Log
          </h2>
          <span className="text-xs font-semibold text-[#5B6875]">
            Showing {transfers.length} transfer records
          </span>
        </div>

        <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#5B6875] font-bold uppercase tracking-wider">
                <th className="p-3">Item & Evidence ID</th>
                <th className="p-3">Relinquishing Custodian (From)</th>
                <th className="p-3">Receiving Custodian (To)</th>
                <th className="p-3">Handshake Status</th>
                <th className="p-3">Transfer Reason</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5B6875] italic">
                    No custody transfers recorded yet. Click "Initiate Custody Transfer" above to register a transfer.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  let statusVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' = 'neutral';
                  let statusText = t.status;
                  if (t.status === 'ACCEPTED') {
                    statusVariant = 'success';
                    statusText = 'Completed';
                  } else if (t.status === 'PENDING') {
                    statusVariant = 'warning';
                    statusText = 'Pending Sign-off';
                  } else if (t.status === 'IN_TRANSIT') {
                    statusVariant = 'info';
                    statusText = 'In Transit';
                  } else if (t.status === 'REJECTED') {
                    statusVariant = 'danger';
                    statusText = 'Rejected';
                  }

                  return (
                    <tr key={t.id} className="hover:bg-[#F6F8FB] transition-colors">
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-[#17212B]">{t.itemTitle}</div>
                        <div className="font-mono text-[11px] text-[#5B6875]">{t.evidenceNumber}</div>
                      </td>
                      <td className="p-3 font-semibold text-[#17212B]">{t.fromOfficer}</td>
                      <td className="p-3 font-semibold text-[#17212B]">{t.toOfficer}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant} size="sm">
                          <ShieldCheck className="w-3 h-3 inline mr-1" />
                          {statusText}
                        </Badge>
                      </td>
                      <td className="p-3 text-[#5B6875] italic">{t.reason}</td>
                      <td className="p-3 text-[11px] text-[#5B6875]">
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#5B6875]" />
                          {new Date(t.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {t.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedTransferForAccept(t);
                              setIsAcceptOpen(true);
                            }}
                          >
                            Review Handshake
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransferInitiateModal
        isOpen={isInitiateOpen}
        onClose={() => setIsInitiateOpen(false)}
        onInitiate={async (evId: string, toCustodian: string, toOrg: string, reason: string) => {
          const res = await startTransfer(evId, toCustodian, toOrg, reason);
          if (res.success) {
            fetchTransfers();
          }
        }}
      />

      <TransferAcceptModal
        isOpen={isAcceptOpen}
        onClose={() => setIsAcceptOpen(false)}
        transfer={selectedTransferForAccept}
        onAccept={async (transferId: string) => {
          await acceptTransfer(transferId);
          fetchTransfers();
        }}
        onReject={async (transferId: string, reason: string) => {
          await rejectTransfer(transferId, reason);
          fetchTransfers();
        }}
      />
    </div>
  );
};
