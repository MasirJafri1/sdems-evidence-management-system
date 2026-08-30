import React, { useState } from 'react';
import { TransferInitiateModal } from '../components/TransferInitiateModal';
import { TransferAcceptModal } from '../components/TransferAcceptModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { GitCommit, ArrowRightLeft, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { useCustodyTransfer } from '../hooks/useCustodyTransfer';

export const CustodyPage: React.FC = () => {
  const { startTransfer, acceptTransfer, rejectTransfer } = useCustodyTransfer();
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);

  // Active transfers state
  const mockTransfers = [
    {
      id: 'trf-001',
      evidenceNumber: 'EVID-2026-9041',
      itemTitle: 'Seized Dell Latitude Forensic Workstation',
      fromOfficer: 'Sub-Inspector Anil Kumar (CBI)',
      toOfficer: 'Senior Inspector Rajesh Sharma (CBI)',
      status: 'ACCEPTED',
      timestamp: new Date().toISOString(),
      reason: 'Forensic drive extraction and hash computation',
    },
  ];

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
            variant="outline"
            onClick={() => setIsAcceptOpen(true)}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          >
            Accept Pending Sign-off
          </Button>
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
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">{mockTransfers.length} Logged</div>
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
            Showing {mockTransfers.length} transfer records
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium bg-white">
              {mockTransfers.map((t) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TransferInitiateModal
        isOpen={isInitiateOpen}
        onClose={() => setIsInitiateOpen(false)}
        evidenceNumber="EVID-2026-9041"
        onInitiate={async (toCustodian: string, toOrg: string, reason: string) => {
          await startTransfer('EVID-2026-9041', toCustodian, toOrg, reason);
        }}
      />

      <TransferAcceptModal
        isOpen={isAcceptOpen}
        onClose={() => setIsAcceptOpen(false)}
        onAccept={async (transferId: string) => {
          await acceptTransfer(transferId);
        }}
        onReject={async (transferId: string) => {
          await rejectTransfer(transferId);
        }}
      />
    </div>
  );
};
