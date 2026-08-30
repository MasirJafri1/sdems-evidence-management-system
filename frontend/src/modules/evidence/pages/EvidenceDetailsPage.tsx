import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvidenceByIdApi } from '../api/evidence.api';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CustodyTimeline } from '../../custody/components/CustodyTimeline';
import { ArrowLeft, GitCommit } from 'lucide-react';
import { ROUTES } from '../../../config/routes.config';

export const EvidenceDetailsPage: React.FC = () => {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const navigate = useNavigate();
  const [evidenceRecord, setEvidenceRecord] = useState<any | null>(null);

  useEffect(() => {
    if (!evidenceId) return;
    getEvidenceByIdApi(evidenceId)
      .then((data) => setEvidenceRecord(data))
      .catch(() => setEvidenceRecord(null));
  }, [evidenceId]);

  const item = {
    evidenceNumber: evidenceRecord?.evidenceNumber || 'EVID-2026-REG',
    title: evidenceRecord?.title || 'Seized Physical Evidence Item',
    status: evidenceRecord?.status || 'In Custody',
    evidenceType: 'Physical Item',
    serialNumber: evidenceRecord?.serialNumber || 'SN-VERIFIED-01',
    storageLocation: evidenceRecord?.storageLocation || 'CFSL Vault Locker 4B',
    caseNumber: 'CASE-2026-Testing',
    currentCustodian: 'Senior Inspector Rajesh Sharma',
    custodianOrganization: 'Central Bureau of Investigation',
    collectedBy: 'Senior Inspector Rajesh Sharma',
    dateCollected: evidenceRecord?.createdAt || new Date().toISOString(),
    history: [],
  };

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => navigate(ROUTES.PROTECTED.EVIDENCE.LIST)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Evidence Registry
        </button>

        <div className="p-5 rounded border border-slate-300 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                {item.evidenceNumber}
              </span>
              <Badge variant="success">{item.status}</Badge>
              <Badge variant="info">{item.evidenceType}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{item.title}</h1>
            <p className="text-xs text-slate-500 font-medium">Serial: {item.serialNumber} • Storage Location: {item.storageLocation}</p>
          </div>

          <Button variant="primary" size="sm" leftIcon={<GitCommit className="w-3.5 h-3.5" />}>
            Initiate Custody Handshake
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="CHAIN OF CUSTODY HISTORY LOG">
            <CustodyTimeline events={item.history} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="EVIDENCE SPECIFICATIONS">
            <div className="space-y-2 text-xs">
              <div><span className="font-bold text-slate-500">Case ID:</span> <span className="font-mono font-bold text-slate-900">{item.caseNumber}</span></div>
              <div><span className="font-bold text-slate-500">Current Custodian:</span> <span className="text-slate-900 font-semibold">{item.currentCustodian}</span></div>
              <div><span className="font-bold text-slate-500">Department:</span> <span className="text-slate-900">{item.custodianOrganization}</span></div>
              <div><span className="font-bold text-slate-500">Collected By:</span> <span className="text-slate-900">{item.collectedBy}</span></div>
              <div><span className="font-bold text-slate-500">Collection Date:</span> <span className="text-slate-700">{new Date(item.dateCollected).toLocaleDateString()}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
