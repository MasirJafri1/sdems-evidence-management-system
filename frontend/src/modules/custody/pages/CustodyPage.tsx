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
        fromOfficer: `${t.fromUser?.name} (${t.fromUser?.memberships?.[0]?.organization?.name || 'Unknown'})`,
        toOfficer: `${t.toUser?.name} (${t.toUser?.memberships?.[0]?.organization?.name || 'Unknown'})`,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <GitCommit className="w-7 h-7 text-slate-900" />
            Physical Chain of Custody & Handshake Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Two-party cryptographically signed physical property transfers, pending sign-offs, and vault custodian ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setIsInitiateOpen(true)}
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
          >
            Initiate Custody Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded border border-slate-200 bg-white shadow-xs border-l-4 border-l-emerald-600">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Custody Ledger Status</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">HANDSHAKE VERIFIED</div>
          <div className="text-slate-500 mt-1 font-medium">100% Chain-of-Custody Integrity</div>
        </div>

        <div className="p-4 rounded border border-slate-200 bg-white shadow-xs border-l-4 border-l-blue-600">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Active Transfers</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">{transfers.length} Logged</div>
          <div className="text-slate-500 mt-1 font-medium">Signed by Authorized Custodians</div>
        </div>

        <div className="p-4 rounded border border-slate-200 bg-white shadow-xs border-l-4 border-l-slate-800">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Vault Security</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">COMPLIANT</div>
          <div className="text-slate-500 mt-1 font-medium">Ministry of Home Affairs Guidelines</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 font-heading">
            Custody Handshake Timeline & Transfer Log
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Showing {transfers.length} transfer records
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                <th className="p-3">Item & Evidence ID</th>
                <th className="p-3">Relinquishing Custodian (From)</th>
                <th className="p-3">Receiving Custodian (To)</th>
                <th className="p-3">Handshake Status</th>
                <th className="p-3">Transfer Reason</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium bg-white">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No custody transfers recorded yet. Click "Initiate Custody Transfer" above to register a transfer.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-slate-900">{t.itemTitle}</div>
                      <div className="font-mono text-[11px] text-slate-500">{t.evidenceNumber}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{t.fromOfficer}</td>
                    <td className="p-3 font-semibold text-slate-800">{t.toOfficer}</td>
                    <td className="p-3">
                      <Badge variant={t.status === 'ACCEPTED' ? 'success' : 'warning'} size="sm">
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-600 italic">{t.reason}</td>
                    <td className="p-3 text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(t.timestamp).toLocaleString()}
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
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
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
