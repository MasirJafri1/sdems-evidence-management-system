import React, { useState, useEffect } from 'react';
import { type MockAuditEvent } from '../../../mock/audit.mock';
import { AuditIntegrityPanel } from '../components/AuditIntegrityPanel';
import { AuditTable } from '../components/AuditTable';
import { Input } from '../../../components/ui/Input';
import { History, Search } from 'lucide-react';
import { useAppSelector } from '../../../store';
import { getGlobalAuditHistoryApi, verifyGlobalAuditChainApi } from '../api/audit.api';
import { useToast } from '../../../components/feedback/useToast';

export const AuditPage: React.FC = () => {
  const toast = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<MockAuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getGlobalAuditHistoryApi();
      if (data && Array.isArray(data.events)) {
        const mapped: MockAuditEvent[] = data.events.map((e: any) => {
          const isCompromised =
            e.eventType === 'DOCUMENT_VERIFIED' &&
            (e.metadata?.status === 'COMPROMISED' || e.metadata?.verificationResult === false);

          const isAccessDenied = e.eventType === 'ACCESS_DENIED';

          return {
            id: e.id,
            sequence: e.sequence,
            timestamp: e.createdAt,
            eventType: (e.eventType || 'SYSTEM_EVENT').replace(/_/g, ' '),
            actor: e.actor ? `${e.actor.name} (${e.actor.email})` : 'System Service / Automated',
            organization: e.case?.organization?.name || user?.organization?.name || 'Department Custody Vault',
            caseNumber: e.case?.caseNumber || 'GLOBAL',
            eventHash: e.eventHash,
            previousHash: e.previousHash || '0000000000000000000000000000000000000000000000000000000000000000',
            integrity: isCompromised ? 'COMPROMISED' : isAccessDenied ? 'BLOCKED' : 'VALID',
            metadata: e.metadata,
          };
        });
        setLogs(mapped);
      }
    } catch (err) {
      console.error('Failed to load audit events from database', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      (l.eventType || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.actor || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.caseNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.eventHash || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyGlobalAuditChainApi();
      if (result.valid) {
        toast.success(
          'Cryptographic Audit Chain Verified',
          `All ${result.totalEvents} sequential SHA-256 events verified against mathematical ledger. 0 tampering detected.`
        );
      } else {
        toast.error('Audit Chain Compromise Detected', 'One or more event hashes failed mathematical verification!');
      }
    } catch (err: any) {
      toast.error('Verification Error', err.response?.data?.message || 'Failed to verify ledger integrity');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[#DCE3EA] pb-4">
        <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-[#123B63]" />
          Append-Only Cryptographic Audit Explorer
        </h1>
        <p className="text-xs text-[#5B6875] mt-0.5">
          Sequential SHA-256 hash-linked audit log guaranteeing non-repudiation across all departmental cases.
        </p>
      </div>

      <AuditIntegrityPanel
        totalEvents={logs.length}
        onVerify={handleVerify}
        isVerifying={isVerifying}
      />

      <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-[#DCE3EA] shadow-2xs">
        <div className="w-full max-w-md">
          <Input
            placeholder="Search event type, officer email, case ID, SHA-256 hash..."
            leftIcon={<Search className="w-4 h-4 text-[#5B6875]" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AuditTable events={filtered} isLoading={isLoading} />
    </div>
  );
};
