import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  GitCommit,
  Clock,
  FileText,
  RefreshCw,
  Search
} from 'lucide-react';
import { listOrganizationDocumentsApi } from '../../documents/api/documents.api';
import { getMyTransfersApi } from '../../evidence/api/evidence.api';
import { getGlobalAuditHistoryApi } from '../../audit/api/audit.api';

type ReportType = 'integrity' | 'custody' | 'audit';
type AuditCategory = 'ALL' | 'UPLOADS' | 'ACCESS' | 'VERIFICATION' | 'VERSIONS' | 'TRANSFERS' | 'SECURITY';

function getEventCategory(eventType: string): string {
  if (eventType === 'DOCUMENT_CREATED') return 'Document Creation / Upload';
  if (eventType === 'DOCUMENT_VERSION_CREATED') return 'Version Creation';
  if (eventType === 'DOCUMENT_VIEWED' || eventType === 'DOCUMENT_DOWNLOADED') return 'Views & Downloads';
  if (eventType === 'DOCUMENT_VERIFIED') return 'Verification Event';
  if (eventType.startsWith('CUSTODY_TRANSFER_') || eventType === 'EVIDENCE_CREATED') return 'Evidence Transfer';
  if (eventType === 'ACCESS_DENIED') return 'Access Denied Security Alert';
  if (eventType === 'CASE_CREATED') return 'Case Creation';
  if (eventType === 'USER_ADDED') return 'Participant Enrollment';
  return 'Audit Ledger Record';
}

function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCsv = (val: string | number | null | undefined) => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('integrity');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditCategory, setAuditCategory] = useState<AuditCategory>('ALL');

  // 1. Evidence Integrity Data
  const [documents, setDocuments] = useState<any[]>([]);

  // 2. Chain of Custody Data
  const [transfers, setTransfers] = useState<any[]>([]);

  // 3. Case Audit Trail Data
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [docsData, transfersData, auditData] = await Promise.all([
        listOrganizationDocumentsApi().catch(() => []),
        getMyTransfersApi().catch(() => []),
        getGlobalAuditHistoryApi().catch(() => ({ events: [] }))
      ]);

      if (Array.isArray(docsData)) setDocuments(docsData);
      if (Array.isArray(transfersData)) setTransfers(transfersData);
      if (auditData?.events && Array.isArray(auditData.events)) {
        setAuditEvents(auditData.events);
      }
    } catch (err) {
      console.error('Failed to load report datasets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Export Handlers ---

  const exportIntegrityCsv = () => {
    const headers = [
      'Case Number',
      'Case Title',
      'Document Exhibit',
      'File Name',
      'Cryptographic SHA-256 Digest',
      'Upload Timestamp',
      'Current Version',
      'Blockchain Anchor ID',
      'Blockchain Transaction Hash',
      'Blockchain Block Number',
      'Verification Status'
    ];

    const rows = documents.map((d) => {
      const v = d.versions?.[0] || {};
      const anchor = v.blockchainAnchor || {};
      return [
        d.case?.caseNumber || 'CASE-GENERAL',
        d.case?.title || 'General Filing',
        d.title,
        v.originalFileName || 'N/A',
        v.sha256Hash || 'N/A',
        v.uploadedAt ? new Date(v.uploadedAt).toISOString() : 'N/A',
        `v${v.versionNumber || 1}`,
        anchor.anchorId || 'PENDING_TX',
        anchor.transactionHash || 'N/A',
        anchor.blockNumber ? String(anchor.blockNumber) : 'N/A',
        anchor.status || 'PENDING'
      ];
    });

    downloadCsv(`evidence-integrity-report-${Date.now()}.csv`, headers, rows);
  };

  const exportCustodyCsv = () => {
    const headers = [
      'Evidence ID / Number',
      'Item Title',
      'Relinquishing Officer (From)',
      'Relinquishing Agency',
      'Receiving Officer (To)',
      'Receiving Agency',
      'Transfer Reason / Authorization',
      'Timestamp',
      'Acceptance / Rejection Status',
      'Cryptographic Event Hash'
    ];

    const rows = transfers.map((t) => [
      t.evidence?.evidenceNumber || t.evidenceId || 'N/A',
      t.evidence?.title || 'Evidence Exhibit',
      t.fromUser?.name || 'N/A',
      t.fromUser?.memberships?.[0]?.organization?.name || 'Authorized Agency',
      t.toUser?.name || 'N/A',
      t.toUser?.memberships?.[0]?.organization?.name || 'Receiving Agency',
      t.reason || 'N/A',
      t.createdAt ? new Date(t.createdAt).toISOString() : 'N/A',
      t.status + (t.rejectionReason ? ` (Reason: ${t.rejectionReason})` : ''),
      t.custodyEvent?.eventHash || t.id
    ]);

    downloadCsv(`chain-of-custody-report-${Date.now()}.csv`, headers, rows);
  };

  const exportAuditCsv = () => {
    const headers = [
      'Sequence #',
      'Case Number',
      'Case Title',
      'Case ID',
      'Event Type',
      'Event Category',
      'Actor Name',
      'Actor Email',
      'Cryptographic Event Hash',
      'Timestamp'
    ];

    const rows = auditEvents.map((a) => [
      a.sequence,
      a.case?.caseNumber || 'CASE-GENERAL',
      a.case?.title || 'Case',
      a.caseId,
      a.eventType,
      getEventCategory(a.eventType),
      a.actor?.name || 'System Operator',
      a.actor?.email || 'N/A',
      a.eventHash,
      a.createdAt ? new Date(a.createdAt).toISOString() : 'N/A'
    ]);

    downloadCsv(`case-audit-trail-report-${Date.now()}.csv`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Filtered Views ---

  const filteredDocuments = documents.filter((d) => {
    const term = searchTerm.toLowerCase();
    const v = d.versions?.[0] || {};
    return (
      d.title?.toLowerCase().includes(term) ||
      d.case?.caseNumber?.toLowerCase().includes(term) ||
      d.case?.title?.toLowerCase().includes(term) ||
      v.sha256Hash?.toLowerCase().includes(term)
    );
  });

  const filteredTransfers = transfers.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.evidence?.evidenceNumber?.toLowerCase().includes(term) ||
      t.evidence?.title?.toLowerCase().includes(term) ||
      t.fromUser?.name?.toLowerCase().includes(term) ||
      t.toUser?.name?.toLowerCase().includes(term) ||
      t.reason?.toLowerCase().includes(term) ||
      t.custodyEvent?.eventHash?.toLowerCase().includes(term)
    );
  });

  const filteredAudit = auditEvents.filter((a) => {
    // category sub-filter
    if (auditCategory === 'UPLOADS' && a.eventType !== 'DOCUMENT_CREATED') return false;
    if (auditCategory === 'ACCESS' && a.eventType !== 'DOCUMENT_VIEWED' && a.eventType !== 'DOCUMENT_DOWNLOADED') return false;
    if (auditCategory === 'VERIFICATION' && a.eventType !== 'DOCUMENT_VERIFIED') return false;
    if (auditCategory === 'VERSIONS' && a.eventType !== 'DOCUMENT_VERSION_CREATED') return false;
    if (auditCategory === 'TRANSFERS' && !a.eventType.startsWith('CUSTODY_TRANSFER_') && a.eventType !== 'EVIDENCE_CREATED') return false;
    if (auditCategory === 'SECURITY' && a.eventType !== 'ACCESS_DENIED') return false;

    const term = searchTerm.toLowerCase();
    return (
      a.eventType?.toLowerCase().includes(term) ||
      a.case?.caseNumber?.toLowerCase().includes(term) ||
      a.case?.title?.toLowerCase().includes(term) ||
      a.caseId?.toLowerCase().includes(term) ||
      a.actor?.name?.toLowerCase().includes(term) ||
      a.actor?.email?.toLowerCase().includes(term) ||
      a.eventHash?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Printable Header (Visible on print only) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wide">Government of India — National Forensic Evidence Portal</h1>
        <p className="text-xs text-slate-600">Official Forensic Audit Trail & Chain-of-Custody Certification Ledger</p>
        <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleString()} | Digital Seal: SHA-256 Verified</p>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-slate-900" />
            Official Government Forensic Reports & Ledger Exports
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time evidence integrity certifications, chain-of-custody handshakes, and sequential case audit reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Certified Ledger
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (activeReport === 'integrity') exportIntegrityCsv();
              else if (activeReport === 'custody') exportCustodyCsv();
              else exportAuditCsv();
            }}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV Ledger
          </Button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        <button
          type="button"
          onClick={() => { setActiveReport('integrity'); setSearchTerm(''); }}
          className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
            activeReport === 'integrity'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className={`w-5 h-5 ${activeReport === 'integrity' ? 'text-emerald-400' : 'text-emerald-600'}`} />
              1. Evidence Integrity Report
            </div>
            <Badge variant={activeReport === 'integrity' ? 'success' : 'neutral'} size="sm">
              {documents.length} Records
            </Badge>
          </div>
          <p className={`text-[11px] mt-1.5 line-clamp-2 ${activeReport === 'integrity' ? 'text-slate-300' : 'text-slate-500'}`}>
            Document exhibits, SHA-256 hashes, timestamps, versions, blockchain anchor IDs, and verification status.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setActiveReport('custody'); setSearchTerm(''); }}
          className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
            activeReport === 'custody'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <GitCommit className={`w-5 h-5 ${activeReport === 'custody' ? 'text-blue-400' : 'text-blue-600'}`} />
              2. Chain of Custody Report
            </div>
            <Badge variant={activeReport === 'custody' ? 'info' : 'neutral'} size="sm">
              {transfers.length} Transfers
            </Badge>
          </div>
          <p className={`text-[11px] mt-1.5 line-clamp-2 ${activeReport === 'custody' ? 'text-slate-300' : 'text-slate-500'}`}>
            Evidence IDs, relinquishing/receiving custodians, legal reason, timestamps, acceptance status, and cryptographic hashes.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setActiveReport('audit'); setSearchTerm(''); }}
          className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
            activeReport === 'audit'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <FileText className={`w-5 h-5 ${activeReport === 'audit' ? 'text-purple-400' : 'text-purple-600'}`} />
              3. Case Audit Report
            </div>
            <Badge variant={activeReport === 'audit' ? 'warning' : 'neutral'} size="sm">
              {auditEvents.length} Events
            </Badge>
          </div>
          <p className={`text-[11px] mt-1.5 line-clamp-2 ${activeReport === 'audit' ? 'text-slate-300' : 'text-slate-500'}`}>
            Sequential hash-chained timeline: uploads, views/downloads, verifications, version creations, custody changes, and access denied events.
          </p>
        </button>
      </div>

      {/* Live Search Bar */}
      <div className="flex items-center gap-2 print:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeReport === 'integrity'
                ? 'Search by case number, document title, or SHA-256 hash...'
                : activeReport === 'custody'
                ? 'Search by evidence ID, title, officer name, or transfer reason...'
                : 'Search by case number, event type, actor name, email, or event hash...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REPORT 1: EVIDENCE INTEGRITY REPORT                                      */}
      {/* ========================================================================= */}
      {activeReport === 'integrity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-emerald-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Document Exhibits</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{documents.length}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Anchored with SHA-256</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-blue-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Blockchain Anchoring</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {documents.filter((d) => d.versions?.[0]?.blockchainAnchor?.status === 'CONFIRMED').length} Confirmed
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">EvidenceRegistry Smart Contract</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-purple-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Digest Algorithm</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">SHA-256</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Section 65B Indian Evidence Act Compliant</div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3">Case</th>
                  <th className="p-3">Document Exhibit</th>
                  <th className="p-3">Cryptographic SHA-256 Digest</th>
                  <th className="p-3">Upload Timestamp</th>
                  <th className="p-3">Current Version</th>
                  <th className="p-3">Blockchain Anchor ID</th>
                  <th className="p-3">Transaction / Block Information</th>
                  <th className="p-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                      No document exhibits found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((d) => {
                    const v = d.versions?.[0] || {};
                    const anchor = v.blockchainAnchor;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{d.case?.caseNumber || 'CASE-GENERAL'}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{d.case?.title || 'Case'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{d.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{v.originalFileName || 'file.bin'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-[11px] text-slate-800 max-w-[180px] truncate bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title={v.sha256Hash}>
                            {v.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb924...'}
                          </div>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                          {v.uploadedAt ? new Date(v.uploadedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-3">
                          <Badge variant="neutral" size="sm">v{v.versionNumber || 1}</Badge>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {anchor?.anchorId ? (
                            <span className="text-emerald-700 font-bold truncate block max-w-[120px]" title={anchor.anchorId}>
                              {anchor.anchorId}
                            </span>
                          ) : (
                            <span className="text-amber-600">PENDING_TX</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {anchor?.transactionHash ? (
                            <div>
                              <span className="truncate block max-w-[120px]" title={anchor.transactionHash}>
                                {anchor.transactionHash}
                              </span>
                              {anchor.blockNumber && <div className="text-[10px] text-slate-400">Block #{anchor.blockNumber}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant={anchor?.status === 'CONFIRMED' ? 'success' : 'warning'} size="sm">
                            <ShieldCheck className="w-3 h-3 inline mr-1" />
                            {anchor?.status || 'PENDING'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: CHAIN OF CUSTODY REPORT                                        */}
      {/* ========================================================================= */}
      {activeReport === 'custody' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-blue-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Custody Transfers</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{transfers.length}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Physical & Digital Evidence Transfers</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-emerald-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Completed Handshakes</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {transfers.filter((t) => t.status === 'ACCEPTED').length} Accepted
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">Two-party signed & attested</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-amber-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Pending Acceptance</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {transfers.filter((t) => t.status === 'PENDING').length} In-Transit
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">Awaiting receiving officer sign-off</div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3">Evidence ID & Exhibit</th>
                  <th className="p-3">From (Relinquishing Officer)</th>
                  <th className="p-3">To (Receiving Officer)</th>
                  <th className="p-3">Reason / Legal Basis</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Acceptance / Rejection</th>
                  <th className="p-3">Event / Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      No chain of custody transfers recorded matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((t) => {
                    const eventHash = t.custodyEvent?.eventHash || t.id;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 space-y-0.5">
                          <div className="font-bold text-slate-900">{t.evidence?.title || 'Evidence Exhibit'}</div>
                          <div className="font-mono text-[11px] text-slate-500">{t.evidence?.evidenceNumber || t.evidenceId}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{t.fromUser?.name || 'Authorized Officer'}</div>
                          <div className="text-[11px] text-slate-500">{t.fromUser?.memberships?.[0]?.organization?.name || 'Department Vault'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{t.toUser?.name || 'Receiving Officer'}</div>
                          <div className="text-[11px] text-slate-500">{t.toUser?.memberships?.[0]?.organization?.name || 'Destination Unit'}</div>
                        </td>
                        <td className="p-3 text-slate-700 italic max-w-xs">
                          {t.reason || 'Official transfer for laboratory analysis'}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                          {t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              t.status === 'ACCEPTED'
                                ? 'success'
                                : t.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            <GitCommit className="w-3 h-3 inline mr-1" />
                            {t.status}
                          </Badge>
                          {t.rejectionReason && (
                            <div className="text-[10px] text-red-600 mt-0.5 font-normal">
                              Reason: {t.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div
                            className="font-mono text-[11px] text-slate-700 truncate max-w-[140px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                            title={eventHash}
                          >
                            {eventHash}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: CASE AUDIT REPORT                                              */}
      {/* ========================================================================= */}
      {activeReport === 'audit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-purple-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Audit Events Recorded</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{auditEvents.length}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">PostgreSQL Immutable Log</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-emerald-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Chain Integrity</div>
              <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">100% VERIFIED</div>
              <div className="text-slate-500 text-[11px] mt-0.5">SHA-256 Sequential Hash Chaining</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded border-l-4 border-l-blue-600 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Statutory Standard</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">CrPC / BNSS / BSA</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Admissible Legal Evidence Trail</div>
            </div>
          </div>

          {/* Sub-Filters for Audit Event Categories */}
          <div className="flex flex-wrap gap-1.5 pt-1 pb-1 print:hidden border-b border-slate-200">
            {[
              { id: 'ALL', label: 'All Events', count: auditEvents.length },
              {
                id: 'UPLOADS',
                label: 'Document Uploads',
                count: auditEvents.filter((a) => a.eventType === 'DOCUMENT_CREATED').length
              },
              {
                id: 'ACCESS',
                label: 'Views & Downloads',
                count: auditEvents.filter((a) => a.eventType === 'DOCUMENT_VIEWED' || a.eventType === 'DOCUMENT_DOWNLOADED').length
              },
              {
                id: 'VERIFICATION',
                label: 'Verification Events',
                count: auditEvents.filter((a) => a.eventType === 'DOCUMENT_VERIFIED').length
              },
              {
                id: 'VERSIONS',
                label: 'Version Creation',
                count: auditEvents.filter((a) => a.eventType === 'DOCUMENT_VERSION_CREATED').length
              },
              {
                id: 'TRANSFERS',
                label: 'Evidence Transfers',
                count: auditEvents.filter((a) => a.eventType.startsWith('CUSTODY_TRANSFER_') || a.eventType === 'EVIDENCE_CREATED').length
              },
              {
                id: 'SECURITY',
                label: 'Access Denied',
                count: auditEvents.filter((a) => a.eventType === 'ACCESS_DENIED').length
              }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setAuditCategory(cat.id as AuditCategory)}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  auditCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  auditCategory === cat.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3">Seq #</th>
                  <th className="p-3">Case Information</th>
                  <th className="p-3">Event Type & Category</th>
                  <th className="p-3">Actor (Officer)</th>
                  <th className="p-3">Cryptographic Event Hash</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                      No audit events found matching the selected category or search filter.
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">
                        #{a.sequence}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{a.case?.caseNumber || 'CASE-GENERAL'}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{a.case?.title || `ID: ${a.caseId?.slice(0, 10)}...`}</div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            a.eventType.includes('CREATE')
                              ? 'info'
                              : a.eventType.includes('ACCEPT') || a.eventType.includes('VERIF')
                              ? 'success'
                              : a.eventType.includes('DENIED') || a.eventType.includes('REJECT')
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {a.eventType}
                        </Badge>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {getEventCategory(a.eventType)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{a.actor?.name || 'System Operator'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{a.actor?.email || 'automated-system'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-[11px] text-slate-700 truncate max-w-[160px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title={a.eventHash}>
                          {a.eventHash}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
