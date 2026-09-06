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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            Cross-Agency Case Access Requests
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage zero-trust permission delegation, inter-departmental requests, and multi-tenant access authorizations.
          </p>
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
        <div className="p-4 rounded border border-slate-200 bg-white shadow-xs border-l-4 border-l-amber-500">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pending Inbound Approval</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {requests.filter((r) => r.status === 'PENDING' && r.userId !== user?.id).length} Requests
          </div>
          <div className="text-slate-500 mt-1 font-medium">Awaiting Custodian Verification</div>
        </div>

        <div className="p-4 rounded border border-slate-200 bg-white shadow-xs border-l-4 border-l-emerald-600">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Approved Authorizations</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {requests.filter((r) => r.status === 'APPROVED').length} Active
          </div>
          <div className="text-slate-500 mt-1 font-medium">Cross-Org Access Active</div>
        </div>

        <div className="p-4 rounded border border-slate-200 bg-white shadow-xs border-l-4 border-l-indigo-600">
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Your Outbound Requests</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {requests.filter((r) => r.userId === user?.id).length} Submitted
          </div>
          <div className="text-slate-500 mt-1 font-medium">Tracking Status Across Agencies</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests by Case ID, Agency, or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              filterMode === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilterMode('INBOUND')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              filterMode === 'INBOUND' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inbound ({requests.filter((r) => r.userId !== user?.id).length})
          </button>
          <button
            onClick={() => setFilterMode('OUTBOUND')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              filterMode === 'OUTBOUND' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Outbound ({requests.filter((r) => r.userId === user?.id).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
              <th className="p-3">Scope</th>
              <th className="p-3">Case Info & ID</th>
              <th className="p-3">Requesting Officer & Agency</th>
              <th className="p-3">Target Holding Agency</th>
              <th className="p-3">Reason / Justification</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Loading database access requests...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                  No access requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const isInbound = req.userId !== user?.id;
                const canManage = isInbound && req.status === 'PENDING';

                return (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      {isInbound ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <ArrowDownLeft className="w-3 h-3 text-amber-600" /> INBOUND
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <ArrowUpRight className="w-3 h-3 text-blue-600" /> OUTBOUND
                        </span>
                      )}
                    </td>
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-slate-900">{req.case?.title || 'Case Record'}</div>
                      <div className="font-mono text-[11px] text-slate-500">{req.case?.caseNumber || req.caseId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">
                        {req.user?.memberships?.[0]?.organization?.name || 'Requesting Agency'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {req.user?.name} ({req.user?.email})
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {req.case?.organization?.name || 'Target Agency'}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate italic" title={req.reason || ''}>
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
                            leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          >
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleRespond(req.id, 'APPROVE')}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          >
                            Grant Access
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
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
                  <><Loader2 className="w-3 h-3 animate-spin text-slate-400" /> <span className="text-slate-500">Verifying case ID in central registry...</span></>
                ) : isValidCase ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-600 font-medium">Case found: {verifiedCaseTitle}</span></>
                ) : (
                  <><XCircle className="w-3 h-3 text-rose-500" /> <span className="text-rose-600 font-medium">Case number not recognized</span></>
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
            <label className="block text-slate-700 font-semibold mb-1">
              Official Justification / Legal Request Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State statutory mandate (e.g. Joint investigation under PMLA Sec 54 or CrPC Sec 91)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
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
