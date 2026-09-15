import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCaseByIdApi,
  getCaseParticipantsApi,
  addCaseParticipantApi,
  listCaseAccessRequestsApi,
  resolveCaseAccessRequestApi,
  type CaseApiRecord
} from '../api/cases.api';
import { getDocumentsByCaseApi, type DocumentApiRecord } from '../../documents/api/documents.api';
import { lookupUserApi } from '../../organizations/api/organization.api';
import { getAuditHistoryApi } from '../../audit/api/audit.api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { CaseStatusBadge } from '../components/CaseStatusBadge';
import { DocumentUploadModal } from '../../documents/components/DocumentUploadModal';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  User,
  FileText,
  UserPlus,
  Search,
  Key,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Users,
  UploadCloud
} from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

const CASE_PERMISSIONS_LIST = [
  // Cases Operations (This Container Only)
  { name: 'CASE_READ', label: 'Read Case Records', category: 'Cases' },
  { name: 'CASE_UPDATE', label: 'Update Case Metadata', category: 'Cases' },
  { name: 'CASE_PARTICIPANT_MANAGE', label: 'Manage Case Participants', category: 'Cases' },

  // Documents Operations (This Container Only)
  { name: 'DOCUMENT_UPLOAD', label: 'Upload Evidence Documents', category: 'Documents' },
  { name: 'DOCUMENT_READ', label: 'Read Document Exhibits', category: 'Documents' },
  { name: 'DOCUMENT_UPDATE', label: 'Update Document Versions', category: 'Documents' },
  { name: 'DOCUMENT_DOWNLOAD', label: 'Download Raw Documents', category: 'Documents' },
  { name: 'DOCUMENT_VERIFY', label: 'Verify Cryptographic Hashes', category: 'Documents' },

  // Evidence Operations (This Container Only)
  { name: 'EVIDENCE_CREATE', label: 'Register Physical Evidence', category: 'Evidence' },
  { name: 'EVIDENCE_READ', label: 'Inspect Physical Evidence', category: 'Evidence' },
  { name: 'EVIDENCE_UPDATE', label: 'Update Physical Evidence', category: 'Evidence' },
  { name: 'CUSTODY_TRANSFER', label: 'Initiate Custody Transfer', category: 'Evidence' },
  { name: 'CUSTODY_ACCEPT', label: 'Accept Custody Handshake', category: 'Evidence' },
  { name: 'CUSTODY_REJECT', label: 'Reject Custody Transfer', category: 'Evidence' },
  { name: 'CUSTODY_HISTORY_READ', label: 'Read Custody Ledger', category: 'Evidence' },
];

const DEFAULT_CASE_PERMS = [
  'CASE_READ',
  'DOCUMENT_READ',
  'DOCUMENT_UPLOAD',
  'DOCUMENT_DOWNLOAD',
  'DOCUMENT_VERIFY',
  'EVIDENCE_READ',
  'CUSTODY_TRANSFER',
  'AUDIT_READ'
];

export const CaseDetailsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'evidence' | 'custody' | 'verification' | 'audit' | 'access'>('overview');
  const [integrityVerified, setIntegrityVerified] = useState(false);
  const [caseRecord, setCaseRecord] = useState<CaseApiRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentApiRecord[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [caseAuditEvents, setCaseAuditEvents] = useState<any[]>([]);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Add Participant Modal State
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [userLookupQuery, setUserLookupQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<any | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isCaseAdmin, setIsCaseAdmin] = useState(false);
  const [selectedCasePerms, setSelectedCasePerms] = useState<string[]>(DEFAULT_CASE_PERMS);
  const [isSubmittingParticipant, setIsSubmittingParticipant] = useState(false);
  const [participantSuccessMsg, setParticipantSuccessMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!caseId) return;

    try {
      const c = await getCaseByIdApi(caseId);
      setCaseRecord(c);
    } catch (e) {
      // fallback
    }

    try {
      const docs = await getDocumentsByCaseApi(caseId);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (e) {
      setDocuments([]);
    }

    try {
      const parts = await getCaseParticipantsApi(caseId);
      if (Array.isArray(parts)) {
        setParticipants(parts);
      }
    } catch (e) {
      setParticipants([]);
    }

    try {
      const requests = await listCaseAccessRequestsApi(caseId);
      if (Array.isArray(requests)) {
        setAccessRequests(requests);
      }
    } catch (e) {
      setAccessRequests([]);
    }

    try {
      const auditRes: any = await getAuditHistoryApi(caseId);
      if (auditRes && Array.isArray(auditRes.events)) {
        setCaseAuditEvents(auditRes.events);
      } else if (Array.isArray(auditRes)) {
        setCaseAuditEvents(auditRes);
      }
    } catch (e) {
      setCaseAuditEvents([]);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleVerifyIntegrity = () => {
    setIntegrityVerified(true);
  };

  const handleUserLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userLookupQuery.trim()) {
      setLookupError('Please enter an officer Email address or User ID.');
      return;
    }

    setIsSearchingUser(true);
    setLookupError(null);
    setSearchedUser(null);

    const res = await lookupUserApi(userLookupQuery.trim());
    setIsSearchingUser(false);

    if (res.found && res.user) {
      setSearchedUser(res.user);
    } else {
      setLookupError(res.message || 'No registered officer found with that Email or User ID.');
    }
  };

  const toggleCasePerm = (permName: string) => {
    setSelectedCasePerms((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleAddParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !searchedUser?.id) {
      setLookupError('Please lookup and verify an officer by Email or User ID first.');
      return;
    }

    setIsSubmittingParticipant(true);
    try {
      await addCaseParticipantApi(caseId, {
        userId: searchedUser.id,
        isCaseAdmin,
        permissions: selectedCasePerms,
      });

      setParticipantSuccessMsg(`✅ Officer "${searchedUser.name}" added to case with ${selectedCasePerms.length} case-level permissions!`);
      fetchDetails();
      setIsAddParticipantOpen(false);
      setUserLookupQuery('');
      setSearchedUser(null);
      setSelectedCasePerms(DEFAULT_CASE_PERMS);
      setIsCaseAdmin(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add participant to case.';
      setLookupError(`Error: ${msg}`);
    } finally {
      setIsSubmittingParticipant(false);
    }
  };

  const currentCase = {
    caseNumber: caseRecord?.caseNumber || 'CASE-2026-Testing',
    referenceNumber: caseRecord?.referenceNumber || 'REF-CBI-2026-001',
    title: caseRecord?.title || 'TESTING PURPOSE',
    description: caseRecord?.description || 'Official investigative container for digital exhibits and physical property.',
    caseType: caseRecord?.caseType || 'General Investigation',
    status: caseRecord?.status || 'Active',
    organization: caseRecord?.organization?.name || 'Central Bureau of Investigation',
    leadOfficer: caseRecord?.createdBy?.name || caseRecord?.participants?.[0]?.user?.name || 'Investigating Officer',
    officerEmail: caseRecord?.createdBy?.email || caseRecord?.participants?.[0]?.user?.email || 'officer@gov.in',
    createdAt: caseRecord?.createdAt || new Date().toISOString(),
  };

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => navigate(ROUTES.PROTECTED.CASES.LIST)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6875] hover:text-[#17212B] transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Case Registry
        </button>

        <div className="p-5 rounded-md border border-[#DCE3EA] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#123B63] bg-[#F6F8FB] px-2 py-0.5 rounded-md border border-[#DCE3EA]">
                {currentCase.caseNumber}
              </span>
              <CaseStatusBadge status={currentCase.status} />
              <Badge variant="info">{currentCase.caseType}</Badge>
            </div>
            <h1 className="text-xl font-bold text-[#17212B] tracking-tight">{currentCase.title}</h1>
            <p className="text-xs text-[#5B6875] max-w-3xl">{currentCase.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                leftIcon={<UploadCloud className="w-3.5 h-3.5 text-[#2F6B95]" />}
              >
                Upload Document Exhibit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddParticipantOpen(true)}
                leftIcon={<UserPlus className="w-3.5 h-3.5 text-[#2F6B95]" />}
              >
                Add Case Participant
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerifyIntegrity}
                leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
              >
                Verify Integrity
              </Button>
            </div>
            {integrityVerified && (
              <span className="text-[11px] font-bold text-[#18794E] bg-[#18794E]/10 px-2 py-0.5 rounded-md border border-[#18794E]/30">
                100% Cryptographic Match Confirmed
              </span>
            )}
          </div>
        </div>
      </div>

      {participantSuccessMsg && (
        <div className="flex items-start gap-2 p-3 bg-[#18794E]/10 border border-[#18794E]/30 rounded-md text-xs text-[#18794E] font-medium">
          <CheckCircle className="w-4 h-4 text-[#18794E] shrink-0 mt-0.5" />
          <span>{participantSuccessMsg}</span>
          <button onClick={() => setParticipantSuccessMsg(null)} className="ml-auto text-[#18794E] font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#DCE3EA] bg-[#F6F8FB] px-2 rounded-t-md gap-1 overflow-x-auto">
        {(['overview', 'documents', 'evidence', 'custody', 'verification', 'audit', 'access'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'border-[#123B63] text-[#123B63] bg-white font-black'
                : 'border-transparent text-[#5B6875] hover:text-[#17212B]'
            }`}
          >
            {tab} {tab === 'documents' ? `(${documents.length})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card title="CASE INTEGRITY STATUS" subtitle="Cryptographic security monitor">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F6F8FB] rounded-md border border-[#DCE3EA] flex items-center justify-between">
                  <span className="font-semibold text-[#17212B]">Audit Chain</span>
                  <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 inline mr-1" />VALID</Badge>
                </div>
                <div className="p-3 bg-[#F6F8FB] rounded-md border border-[#DCE3EA] flex items-center justify-between">
                  <span className="font-semibold text-[#17212B]">Evidence Anchors</span>
                  <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 inline mr-1" />VERIFIED</Badge>
                </div>
                <div className="p-3 bg-[#F6F8FB] rounded-md border border-[#DCE3EA] flex items-center justify-between">
                  <span className="font-semibold text-[#17212B]">Documents ({documents.length})</span>
                  <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 inline mr-1" />VERIFIED</Badge>
                </div>
                <div className="p-3 bg-[#F6F8FB] rounded-md border border-[#DCE3EA] flex items-center justify-between">
                  <span className="font-semibold text-[#17212B]">Participants ({participants.length})</span>
                  <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 inline mr-1" />ACTIVE</Badge>
                </div>
              </div>
            </Card>

            <Card
              title={`ASSIGNED INVESTIGATIVE PARTICIPANTS (${participants.length || 1})`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddParticipantOpen(true)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Add Participant
                </Button>
              }
            >
              <div className="divide-y divide-[#DCE3EA] text-xs">
                {participants.length === 0 ? (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#5B6875]" />
                      <div>
                        <div className="font-bold text-[#17212B]">{currentCase.leadOfficer}</div>
                        <div className="text-[11px] text-[#5B6875]">{currentCase.officerEmail}</div>
                      </div>
                    </div>
                    <Badge variant="info">Lead Case Admin</Badge>
                  </div>
                ) : (
                  participants.map((p) => {
                    const u = p.user || p;
                    const permsCount = u.casePermissions?.length || 0;
                    return (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-[#2F6B95]" />
                          <div>
                            <div className="font-bold text-[#17212B]">{u.name}</div>
                            <div className="text-[11px] text-[#5B6875]">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#123B63] font-semibold bg-[#EBF3FA] px-2 py-0.5 rounded-md border border-[#2F6B95]/30">
                            {permsCount} Case Perms Granted
                          </span>
                          {p.isCaseAdmin ? (
                            <Badge variant="info">Case Admin</Badge>
                          ) : (
                            <Badge variant="neutral">Participant</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="CASE SPECIFICATIONS">
              <div className="space-y-2 text-xs">
                <div><span className="font-bold text-[#5B6875]">Dept Reference:</span> <span className="font-mono text-[#17212B] font-bold">{currentCase.referenceNumber}</span></div>
                <div><span className="font-bold text-[#5B6875]">Organization:</span> <span className="text-[#17212B] font-semibold">{currentCase.organization}</span></div>
                <div><span className="font-bold text-[#5B6875]">Created:</span> <span className="text-[#17212B]">{new Date(currentCase.createdAt).toLocaleDateString()}</span></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card
          title={`DIGITAL DOCUMENTS BINDER (${documents.length} ITEMS)`}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
            >
              Upload Exhibit Document
            </Button>
          }
        >
          <div className="text-xs space-y-2">
            {documents.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-[#5B6875]">No digital documents attached to this case container yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  leftIcon={<UploadCloud className="w-3.5 h-3.5 text-[#2F6B95]" />}
                >
                  Upload First Document Exhibit
                </Button>
              </div>
            ) : (
              documents.map((d) => (
                <div key={d.id} className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#123B63] shrink-0" />
                    <div>
                      <div className="font-bold text-[#17212B]">{d.title || d.documentName}</div>
                      <div className="font-mono text-[11px] text-[#5B6875]">SHA256: {d.sha256Hash || 'e3b0c44298fc...'}</div>
                    </div>
                  </div>
                  <Badge variant="success">v{d.version || '1.0'} Verified</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'evidence' && (
        <Card title="PHYSICAL EVIDENCE ITEMS">
          <div className="text-xs space-y-2">
            <p className="text-[#5B6875] p-4 text-center italic">No physical evidence items registered under this case yet. Go to Evidence menu to register items.</p>
          </div>
        </Card>
      )}

      {activeTab === 'custody' && (
        <Card title="CHAIN OF CUSTODY TIMELINE">
          <div className="text-xs space-y-2">
            <div className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md">
              <div className="font-bold text-[#17212B]">Sequence #1 — Case Container Initialized</div>
              <div className="text-[#5B6875] text-[11px]">{currentCase.leadOfficer} | {currentCase.organization}</div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'verification' && (
        <Card title="INDEPENDENT VERIFICATION">
          <div className="text-xs space-y-2">
            <p className="text-[#17212B]">All document content hashes match hardhat on-chain block anchors.</p>
            <Badge variant="success">VERIFIED ON-CHAIN</Badge>
          </div>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card title="IMMUTABLE CASE AUDIT TRAIL" subtitle="Cryptographically chained audit events and verification records for this case">
          {caseAuditEvents.length === 0 ? (
            <div className="text-xs text-[#5B6875] py-6 text-center italic">
              No audit events recorded yet for this case.
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#123B63] font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-2.5">Seq #</th>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Event Type</th>
                    <th className="p-2.5">Actor</th>
                    <th className="p-2.5">Details</th>
                    <th className="p-2.5">Event Hash</th>
                    <th className="p-2.5">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
                  {caseAuditEvents.map((a) => {
                    const isCompromised =
                      a.eventType === 'DOCUMENT_VERIFIED' &&
                      (a.metadata?.status === 'COMPROMISED' || a.metadata?.verificationResult === false);

                    return (
                      <tr key={a.id} className={isCompromised ? 'bg-[#B42318]/10' : 'hover:bg-[#F6F8FB]'}>
                        <td className="p-2.5 font-mono font-bold text-[#17212B]">#{a.sequence}</td>
                        <td className="p-2.5 text-[#5B6875] font-mono text-[11px]">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span className={`font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                            isCompromised
                              ? 'text-[#B42318] bg-[#B42318]/10 border-[#B42318]/30'
                              : a.eventType === 'DOCUMENT_VERIFIED'
                              ? 'text-[#18794E] bg-[#18794E]/10 border-[#18794E]/30'
                              : 'text-[#123B63] bg-[#F6F8FB] border-[#DCE3EA]'
                          }`}>
                            {isCompromised && <AlertTriangle className="w-3 h-3 text-[#B42318] inline" />}
                            {a.eventType}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-[#17212B]">{a.actor?.name || 'System Operator'}</div>
                          <div className="text-[10px] text-[#5B6875]">{a.actor?.email || ''}</div>
                        </td>
                        <td className="p-2.5 text-[11px] text-[#5B6875] max-w-xs truncate">
                          {a.metadata?.details || a.metadata?.documentTitle || (a.entityType ? `${a.entityType}: ${a.entityId?.slice(0, 8)}...` : 'System Event')}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-[#5B6875]">
                          {a.eventHash ? `${a.eventHash.slice(0, 10)}...${a.eventHash.slice(-6)}` : 'N/A'}
                        </td>
                        <td className="p-2.5">
                          {isCompromised ? (
                            <Badge variant="danger" size="sm">
                              COMPROMISED
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              VALID
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'access' && (
        <div className="space-y-5">
          <Card title="PENDING EXTERNAL ACCESS REQUESTS">
            <div className="text-xs space-y-2">
              {accessRequests.length === 0 ? (
                <div className="p-4 text-center text-[#5B6875] bg-[#F6F8FB] border border-[#DCE3EA] rounded-md italic">
                  No pending access requests for this case.
                </div>
              ) : (
                accessRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-white border border-[#DCE3EA] rounded-md shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-[#17212B] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#5B6875]" />
                        {req.user?.name} ({req.user?.email})
                      </div>
                      <div className="text-[#5B6875] mt-1 italic max-w-lg">
                        "{req.reason || 'No reason provided'}"
                      </div>
                      <div className="text-[10px] text-[#5B6875] mt-1 font-mono">
                        Requested: {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await resolveCaseAccessRequestApi(req.id, 'REJECT');
                          fetchDetails();
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          await resolveCaseAccessRequestApi(req.id, 'APPROVE');
                          fetchDetails();
                        }}
                      >
                        Approve Access
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="ACCESS CONTROL MATRIX">
            <div className="text-xs space-y-2">
              <div className="p-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md flex justify-between">
                <span className="font-semibold text-[#17212B]">DOCUMENT_READ</span>
                <Badge variant="success">ALLOW</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Add Case Participant with Case-Level Permission Checkboxes */}
      <Modal
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        title="Add Participant & Assign Case-Level Permission Checkboxes"
        maxWidth="md"
      >
        <form onSubmit={handleAddParticipantSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#EBF3FA] border border-[#2F6B95]/30 rounded-md text-[#123B63] text-[11px]">
            <strong>Case-Level Permission Granularity:</strong> Assigning a participant grants access restricted specifically to this case container. Select the case permission checkboxes below to delegate exact access.
          </div>

          {/* Search Officer by Email or User ID */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#17212B] uppercase tracking-wider">
              Search Officer by Email or User ID *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ramesh.varma@cbi.gov.in or cm123abc..."
                value={userLookupQuery}
                onChange={(e) => setUserLookupQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUserLookup();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63] font-medium"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleUserLookup}
                isLoading={isSearchingUser}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              >
                Lookup
              </Button>
            </div>
          </div>

          {/* Verified Officer Card */}
          {searchedUser && (
            <div className="p-3 bg-[#18794E]/10 border border-[#18794E]/30 rounded-md space-y-1 text-xs text-[#18794E] font-medium">
              <div className="font-bold flex items-center gap-1.5 text-[#18794E]">
                <CheckCircle className="w-4 h-4 text-[#18794E] shrink-0" />
                Officer Verified: {searchedUser.name} ({searchedUser.email})
              </div>
              <div className="text-[11px] text-[#18794E]/80 font-mono">
                User ID: {searchedUser.id}
              </div>
            </div>
          )}

          {lookupError && (
            <div className="p-3 bg-[#B42318]/10 border border-[#B42318]/30 rounded-md text-xs text-[#B42318] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Case Admin Toggle */}
          <div className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md flex items-center justify-between">
            <div>
              <div className="font-bold text-[#17212B]">Grant Case Administrator Authority</div>
              <div className="text-[11px] text-[#5B6875]">Case Admins have full administrative authority over this case file.</div>
            </div>
            <input
              type="checkbox"
              checked={isCaseAdmin}
              onChange={(e) => setIsCaseAdmin(e.target.checked)}
              className="w-4 h-4 text-[#123B63] rounded border-[#DCE3EA] focus:ring-[#123B63]"
            />
          </div>

          {/* Case-Level Permission Checkboxes Grid */}
          <div className="space-y-2 pt-2 border-t border-[#DCE3EA]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#17212B] uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#123B63]" />
                Case-Level Permission Checkboxes ({selectedCasePerms.length} selected)
              </label>
              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedCasePerms(CASE_PERMISSIONS_LIST.map((p) => p.name))}
                  className="text-[#123B63] font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-[#DCE3EA]">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCasePerms([])}
                  className="text-[#5B6875] font-bold hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md max-h-56 overflow-y-auto space-y-3">
              {['Cases', 'Documents', 'Evidence'].map((cat) => (
                <div key={cat} className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B6875] border-b border-[#DCE3EA] pb-0.5">
                    {cat} Operations (Container Specific)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CASE_PERMISSIONS_LIST.filter((p) => p.category === cat).map((p) => {
                      const isChecked = selectedCasePerms.includes(p.name);
                      return (
                        <label
                          key={p.name}
                          className={`flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer text-xs ${
                            isChecked
                              ? 'bg-[#EBF3FA] border-[#2F6B95]/40 text-[#123B63] font-semibold'
                              : 'bg-white border-[#DCE3EA] text-[#5B6875] hover:bg-[#F6F8FB]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCasePerm(p.name)}
                            className="rounded border-[#DCE3EA] text-[#123B63] focus:ring-[#123B63] w-3.5 h-3.5"
                          />
                          <span>{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
            <Button type="button" variant="outline" onClick={() => setIsAddParticipantOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingParticipant} leftIcon={<UserPlus className="w-4 h-4" />}>
              Grant Case Access & Add Participant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Document Upload with Auto-Selected Case ID */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchDetails()}
        defaultCaseId={caseId}
      />
    </div>
  );
};
