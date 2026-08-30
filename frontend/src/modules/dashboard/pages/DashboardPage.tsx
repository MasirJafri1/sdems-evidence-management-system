import React, { useState } from 'react';
import { KPIBlock } from '../components/KPIBlock';
import { RecentActivityTimeline } from '../components/RecentActivityTimeline';
import { SystemIntegrityPanel } from '../components/SystemIntegrityPanel';
import { CasesTable } from '../../cases/components/CasesTable';
import { CreateCaseModal } from '../../cases/components/CreateCaseModal';
import { useCaseList } from '../../cases/hooks/useCaseList';
import { Button } from '../../../components/ui/Button';
import { FolderPlus } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { cases, isLoading, createNewCase } = useCaseList();
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const activeCasesCount = cases.length;
  const totalDocs = cases.reduce((acc, curr) => acc + (curr.documentCount || 0), 0);
  const totalEvidence = cases.reduce((acc, curr) => acc + (curr.evidenceCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Evidence under your authority
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time evidence status and active digital records under your jurisdiction.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCaseModalOpen(true)}
          leftIcon={<FolderPlus className="w-4 h-4" />}
        >
          Initialize New Case
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBlock title="Active Cases" value={activeCasesCount} subtitle="Registered containers" statusColor="blue" />
        <KPIBlock title="Digital Exhibits" value={totalDocs} subtitle="Keccak-256 anchored" statusColor="emerald" />
        <KPIBlock title="Physical Property" value={totalEvidence} subtitle="In vault custody" statusColor="amber" />
        <KPIBlock title="Blockchain Status" value="ACTIVE" subtitle="Hardhat local node" statusColor="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 font-heading">
              Active Case Registry
            </h2>
            <span className="text-xs font-semibold text-slate-600">
              Showing {cases.length} records
            </span>
          </div>

          <CasesTable cases={cases} isLoading={isLoading} />
        </div>

        <div className="space-y-6">
          <SystemIntegrityPanel />
          <RecentActivityTimeline />
        </div>
      </div>

      <CreateCaseModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        onSuccess={(c) => createNewCase(c as any)}
      />
    </div>
  );
};
