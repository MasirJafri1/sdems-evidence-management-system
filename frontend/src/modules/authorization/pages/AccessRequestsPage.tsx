import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { ShieldAlert, CheckCircle2, XCircle, Send, Search, Building2, Clock, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { verifyCaseApi, listCaseAccessRequestsApi, requestCaseAccessApi, resolveCaseAccessRequestApi } from '../../cases/api/cases.api';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../components/feedback/useToast';

interface AccessRequestItem {
  id: string;
  caseId: string;
  userId: string;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    memberships?: Array<{
      organization?: {
        id: string;
        name: string;
        code: string;
      };
    }>;
  };
  case?: {
    id: string;
    caseNumber: string;
    title: string;
    organization?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export const AccessRequestsPage: React.FC = () => {
  const toast = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetCaseId, setTargetCaseId] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isValidCase, setIsValidCase] = useState<boolean | null>(null);
  const [verifiedCaseTitle, setVerifiedCaseTitle] = useState<string | null>(null);

  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await listCaseAccessRequestsApi();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load access requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!targetCaseId || targetCaseId.trim() === '') {
      setIsValidCase(null);
      setVerifiedCaseTitle(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsVerifying(true);
      try {
        const result = await verifyCaseApi(targetCaseId);
        setIsValidCase(result.valid);
        if (result.valid && result.title) {
          setVerifiedCaseTitle(result.title);
        } else {
          setVerifiedCaseTitle(null);
        }
      } catch (err) {
        setIsValidCase(false);
        setVerifiedCaseTitle(null);
      } finally {
        setIsVerifying(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [targetCaseId]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCaseId.trim()) return;

    setIsSubmitting(true);
    try {
      await requestCaseAccessApi(targetCaseId.trim(), reason.trim());
      toast.success('Access Request Submitted', `Request for ${targetCaseId} forwarded to holding agency.`);
      setTargetCaseId('');
      setTargetOrg('');
      setReason('');
      setIsModalOpen(false);
      await fetchRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit access request';
      toast.error('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await resolveCaseAccessRequestApi(id, action);
      toast.success(
        action === 'APPROVE' ? 'Access Granted' : 'Request Denied',
        `Access request has been ${action === 'APPROVE' ? 'approved' : 'rejected'} and permissions synced.`
      );
      await fetchRequests();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update request status';
      toast.error('Action Failed', msg);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const caseTitle = r.case?.title || '';
    const caseNumber = r.case?.caseNumber || '';
    const officerName = r.user?.name || '';
    const userOrg = r.user?.memberships?.[0]?.organization?.name || '';
    const targetOrgName = r.case?.organization?.name || '';

    const matchesSearch =
      caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetOrgName.toLowerCase().includes(searchTerm.toLowerCase());

    const isInbound = r.userId !== user?.id;
    const isOutbound = r.userId === user?.id;

    if (filterMode === 'INBOUND') return matchesSearch && isInbound;
    if (filterMode === 'OUTBOUND') return matchesSearch && isOutbound;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#123B63]/5 rounded-md border border-[#123B63]/10">
              <ShieldAlert className="w-5 h-5 text-[#123B63]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#17212B] tracking-tight font-heading">
                Cross-Agency Case Access Requests
              </h1>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Manage zero-trust permission delegation, inter-departmental requests, and multi-tenant access authorizations.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Send className="w-4 h-4" />}
        >
          Request External Access
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-xs border-l-4 border-l-[#A66A00]">
          <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">Pending Inbound Approval</div>
          <div className="text-xl font-bold text-[#17212B] font-mono mt-1">
            {requests.filter((r) => r.status === 'PENDING' && r.userId !== user?.id).length} Requests
          </div>
          <div className="text-[#5B6875] mt-1 font-medium">Awaiting Custodian Verification</div>
        </div>

        <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-xs border-l-4 border-l-[#18794E]">
          <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">Approved Authorizations</div>
          <div className="text-xl font-bold text-[#17212B] font-mono mt-1">
            {requests.filter((r) => r.status === 'APPROVED').length} Active
          </div>
          <div className="text-[#5B6875] mt-1 font-medium">Cross-Org Access Active</div>
        </div>

        <div className="p-4 rounded-md border border-[#DCE3EA] bg-white shadow-xs border-l-4 border-l-[#123B63]">
          <div className="font-bold text-[#5B6875] uppercase tracking-wider text-[10px]">Your Outbound Requests</div>
          <div className="text-xl font-bold text-[#17212B] font-mono mt-1">
            {requests.filter((r) => r.userId === user?.id).length} Submitted
          </div>
          <div className="text-[#5B6875] mt-1 font-medium">Tracking Status Across Agencies</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6875]" />
          <input
            type="text"
            placeholder="Search requests by Case ID, Agency, or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#DCE3EA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs bg-[#F6F8FB] p-1 rounded-md border border-[#DCE3EA]">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'ALL' ? 'bg-white shadow-xs text-[#123B63]' : 'text-[#5B6875] hover:text-[#17212B]'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilterMode('INBOUND')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'INBOUND' ? 'bg-white shadow-xs text-[#123B63]' : 'text-[#5B6875] hover:text-[#17212B]'
            }`}
          >
            Inbound ({requests.filter((r) => r.userId !== user?.id).length})
          </button>
          <button
            onClick={() => setFilterMode('OUTBOUND')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              filterMode === 'OUTBOUND' ? 'bg-white shadow-xs text-[#123B63]' : 'text-[#5B6875] hover:text-[#17212B]'
            }`}
          >
            Outbound ({requests.filter((r) => r.userId === user?.id).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#DCE3EA] rounded-md bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#DCE3EA] bg-[#F6F8FB] text-[#123B63] font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3">Scope</th>
              <th className="p-3">Case Info & ID</th>
              <th className="p-3">Requesting Officer & Agency</th>
              <th className="p-3">Target Holding Agency</th>
              <th className="p-3">Reason / Justification</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE3EA] font-medium bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[#5B6875]">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#5B6875]" />
                    <span>Loading database access requests...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[#5B6875] italic">
                  No access requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const isInbound = req.userId !== user?.id;
                const canManage = isInbound && req.status === 'PENDING';

                return (
                  <tr key={req.id} className="hover:bg-[#F6F8FB]">
                    <td className="p-3">
                      {isInbound ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#A66A00]/10 text-[#A66A00] border border-[#A66A00]/30">
                          <ArrowDownLeft className="w-3 h-3 text-[#A66A00]" /> INBOUND
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#2F6B95]/10 text-[#2F6B95] border border-[#2F6B95]/30">
                          <ArrowUpRight className="w-3 h-3 text-[#2F6B95]" /> OUTBOUND
                        </span>
                      )}
                    </td>
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-[#17212B]">{req.case?.title || 'Case Record'}</div>
                      <div className="font-mono text-[11px] text-[#5B6875]">{req.case?.caseNumber || req.caseId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[#17212B]">
                        {req.user?.memberships?.[0]?.organization?.name ||
                          (req.user?.email === 'superadmin@gov.in'
                            ? 'Government of India (Super Admin)'
                            : '⚡ Standalone Officer (No Agency)')}
                      </div>
                      <div className="text-[11px] text-[#5B6875]">
                        {req.user?.name} ({req.user?.email})
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-[#17212B]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#5B6875]" />
                        {req.case?.organization?.name || 'Target Agency'}
                      </div>
                    </td>
                    <td className="p-3 text-[#5B6875] max-w-xs truncate italic" title={req.reason || ''}>
                      {req.reason || 'No justification provided'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          req.status === 'APPROVED'
                            ? 'success'
                            : req.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespond(req.id, 'REJECT')}
                            leftIcon={<XCircle className="w-3.5 h-3.5 text-[#B42318]" />}
                          >
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleRespond(req.id, 'APPROVE')}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#18794E]" />}
                          >
                            Grant Access
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#5B6875] font-mono">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {req.status === 'PENDING' ? 'Awaiting Custodian' : 'Decided'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Access Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit External Case Access Request"
        maxWidth="md"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div>
            <Input
              label="Target Case ID (e.g. CBI-OFT-20260905-XXXX)"
              value={targetCaseId}
              onChange={(e) => setTargetCaseId(e.target.value)}
              placeholder="Enter Case ID or Case Number"
              required
            />
            {targetCaseId && (
              <div className="mt-1 flex items-center gap-1 text-[10px]">
                {isVerifying ? (
                  <><Loader2 className="w-3 h-3 animate-spin text-[#5B6875]" /> <span className="text-[#5B6875]">Verifying case ID in central registry...</span></>
                ) : isValidCase ? (
                  <><CheckCircle2 className="w-3 h-3 text-[#18794E]" /> <span className="text-[#18794E] font-medium">Case found: {verifiedCaseTitle}</span></>
                ) : (
                  <><XCircle className="w-3 h-3 text-[#B42318]" /> <span className="text-[#B42318] font-medium">Case number not recognized</span></>
                )}
              </div>
            )}
          </div>

          <Input
            label="Target Holding Organization / Agency"
            value={targetOrg}
            onChange={(e) => setTargetOrg(e.target.value)}
            placeholder="e.g. Central Bureau of Investigation"
          />

          <div>
            <label className="block text-[#17212B] font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Official Justification / Legal Request Reason <span className="text-[#B42318]">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State statutory mandate (e.g. Joint investigation under PMLA Sec 54 or CrPC Sec 91)..."
              className="w-full px-3 py-2 text-xs border border-[#DCE3EA] rounded-md focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-white text-[#17212B]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Send className="w-4 h-4" />}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
