import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { ShieldAlert, CheckCircle2, XCircle, Send, Search, Building2, Clock, Loader2 } from 'lucide-react';
import { verifyCaseApi } from '../../cases/api/cases.api';

interface AccessRequest {
  id: string;
  caseId: string;
  caseTitle: string;
  requestingOrg: string;
  requestingOfficer: string;
  targetOrg: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export const AccessRequestsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetCaseId, setTargetCaseId] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [reason, setReason] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isValidCase, setIsValidCase] = useState<boolean | null>(null);
  const [verifiedCaseTitle, setVerifiedCaseTitle] = useState<string | null>(null);

  const [requests, setRequests] = useState<AccessRequest[]>([]);

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


  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: AccessRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      caseId: targetCaseId,
      caseTitle: 'Cross-Agency Legal Case Record',
      requestingOrg: 'Central Bureau of Investigation (CBI)',
      requestingOfficer: 'Senior Officer (Current User)',
      targetOrg: targetOrg || 'External Law Enforcement Agency',
      reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };
    setRequests([newReq, ...requests]);
    setTargetCaseId('');
    setTargetOrg('');
    setReason('');
    setIsModalOpen(false);
  };

  const handleRespond = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestingOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.caseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pending Approval</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {requests.filter((r) => r.status === 'PENDING').length} Requests
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
          <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">ABAC Governance</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">STRICT ENFORCEMENT</div>
          <div className="text-slate-500 mt-1 font-medium">Attribute-Based Case Isolation</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests by Case ID, Agency, or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
              <th className="p-3">Case Info & ID</th>
              <th className="p-3">Requesting Agency</th>
              <th className="p-3">Target Organization</th>
              <th className="p-3">Reason / Justification</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium bg-white">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                  No access requests found matching your query.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="p-3 space-y-0.5">
                    <div className="font-bold text-slate-900">{req.caseTitle}</div>
                    <div className="font-mono text-[11px] text-slate-500">{req.caseId}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{req.requestingOrg}</div>
                    <div className="text-[11px] text-slate-500">{req.requestingOfficer}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-700 flex items-center gap-1.5 pt-4">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {req.targetOrg}
                  </td>
                  <td className="p-3 text-slate-600 max-w-xs truncate italic">{req.reason}</td>
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
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespond(req.id, 'REJECTED')}
                          leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        >
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRespond(req.id, 'APPROVED')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        >
                          Grant Access
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Decided
                      </span>
                    )}
                  </td>
                </tr>
              ))
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
              label="Target Case ID (e.g. CASE-2026-0892)"
              value={targetCaseId}
              onChange={(e) => setTargetCaseId(e.target.value)}
              placeholder="CASE-YYYY-XXXX"
              required
            />
            {targetCaseId && (
              <div className="mt-1 flex items-center gap-1 text-[10px]">
                {isVerifying ? (
                  <><Loader2 className="w-3 h-3 animate-spin text-slate-400" /> <span className="text-slate-500">Verifying case ID...</span></>
                ) : isValidCase ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-600 font-medium">Case found: {verifiedCaseTitle}</span></>
                ) : (
                  <><XCircle className="w-3 h-3 text-rose-500" /> <span className="text-rose-600 font-medium">Invalid or unknown case ID</span></>
                )}
              </div>
            )}
          </div>

          <Input
            label="Target Holding Organization / Agency"
            value={targetOrg}
            onChange={(e) => setTargetOrg(e.target.value)}
            placeholder="e.g. State Police Cyber Crime Division"
            required
          />

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Official Justification / Legal Request Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the statutory reason or joint investigation mandate..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Send className="w-4 h-4" />}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
