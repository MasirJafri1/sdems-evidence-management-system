import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPIBlock } from '../components/KPIBlock';
import { RecentActivityTimeline } from '../components/RecentActivityTimeline';
import { SystemIntegrityPanel } from '../components/SystemIntegrityPanel';
import { CasesTable } from '../../cases/components/CasesTable';
import { CreateCaseModal } from '../../cases/components/CreateCaseModal';
import { useCaseList } from '../../cases/hooks/useCaseList';
import { useAppSelector } from '../../../store';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../config/routes.config';
import buildingPng from '../../../assets/govt_building.png';
import {
  FolderPlus,
  FileCheck,
  GitCommit,
  FolderArchive,
  Upload,
  CheckCircle,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { cases, isLoading, createNewCase } = useCaseList();
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const activeCasesCount = cases.length;
  const totalEvidence = cases.reduce((acc, curr) => acc + (curr.evidenceCount || 0) + (curr.documentCount || 0), 0);
  const pendingTransfersCount = cases.filter((c) => (c.status as string) === 'UNDER_INVESTIGATION' || c.status === 'Active').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight">
            Good Morning, {user?.name || 'Officer'}
          </h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Here's an overview of the digital evidence system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROTECTED.VERIFICATION)}
            leftIcon={<FileCheck className="w-3.5 h-3.5 text-[#2F6B95]" />}
            size="sm"
          >
            Verify Record
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCaseModalOpen(true)}
            leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
            size="sm"
          >
            Create Case
          </Button>
        </div>
      </div>

      {/* Prominent Core Purpose / System Integrity Banner (Matching Screenshot 2) */}
      <div className="rounded-xl border border-[#DCE3EA] bg-gradient-to-r from-[#F0F5FA]/90 via-[#F6F8FB] to-[#FFFFFF] p-5 lg:p-6 shadow-2xs relative overflow-hidden">
        {/* Building background graphic watermark */}
        <div className="absolute right-14 top-0 bottom-0 w-1/2 pointer-events-none opacity-[0.22] flex items-center justify-end overflow-hidden select-none">
          <img src={buildingPng} alt="Government Building Asset" className="h-full max-h-40 w-auto object-contain object-right" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 max-w-3xl">
            {/* Blue Shield Icon Badge */}
            <div className="w-12 h-12 rounded-xl bg-[#0F2D4A] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#123B63]">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-[#123B63] leading-snug tracking-tight">
                Ensuring Integrity, Traceability and Trust in Evidence
              </h2>
              <p className="text-xs text-[#5B6875] leading-relaxed max-w-2xl font-normal">
                A unified platform for secure storage, verifiable records and seamless collaboration across Police, Forensic, Judicial and Government Departments.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBlock
          title="Active Cases"
          value={activeCasesCount}
          subtitle="Under active investigation"
          statusColor="blue"
          icon={<FolderArchive className="w-4 h-4" />}
        />
        <KPIBlock
          title="Evidence Records"
          value={totalEvidence}
          subtitle="Cryptographically verified"
          statusColor="emerald"
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <KPIBlock
          title="Pending Transfers"
          value={pendingTransfersCount}
          subtitle="Awaiting custody sign-off"
          statusColor="amber"
          icon={<ArrowRightLeft className="w-4 h-4" />}
        />
        <KPIBlock
          title="Integrity Alerts"
          value={0}
          subtitle="All SHA-256 hashes matched"
          statusColor="emerald"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate(ROUTES.PROTECTED.DOCUMENTS.LIST)}
          className="p-3 bg-white border border-[#DCE3EA] rounded-md hover:border-[#123B63] hover:bg-[#F6F8FB] transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#123B63]">
            <Upload className="w-4 h-4 text-[#2F6B95] group-hover:scale-105 transition-transform" />
            <span>Upload Evidence</span>
          </div>
          <p className="text-[10px] text-[#5B6875] mt-1">Register new digital exhibit</p>
        </button>

        <button
          onClick={() => navigate(ROUTES.PROTECTED.VERIFICATION)}
          className="p-3 bg-white border border-[#DCE3EA] rounded-md hover:border-[#123B63] hover:bg-[#F6F8FB] transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#123B63]">
            <FileCheck className="w-4 h-4 text-[#18794E] group-hover:scale-105 transition-transform" />
            <span>Verify Evidence</span>
          </div>
          <p className="text-[10px] text-[#5B6875] mt-1">Check SHA-256 & anchor</p>
        </button>

        <button
          onClick={() => navigate(ROUTES.PROTECTED.CUSTODY.LIST)}
          className="p-3 bg-white border border-[#DCE3EA] rounded-md hover:border-[#123B63] hover:bg-[#F6F8FB] transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#123B63]">
            <GitCommit className="w-4 h-4 text-[#2F6B95] group-hover:scale-105 transition-transform" />
            <span>Initiate Transfer</span>
          </div>
          <p className="text-[10px] text-[#5B6875] mt-1">Transfer chain of custody</p>
        </button>

        <button
          onClick={() => setIsCaseModalOpen(true)}
          className="p-3 bg-white border border-[#DCE3EA] rounded-md hover:border-[#123B63] hover:bg-[#F6F8FB] transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#123B63]">
            <FolderPlus className="w-4 h-4 text-[#B58B4A] group-hover:scale-105 transition-transform" />
            <span>Create Case</span>
          </div>
          <p className="text-[10px] text-[#5B6875] mt-1">Open new investigation</p>
        </button>
      </div>

      {/* Main Grid: Cases Registry & Integrity Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#123B63] uppercase tracking-wider">
              Active Case Registry
            </h2>
            <span className="text-xs font-semibold text-[#5B6875]">
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
