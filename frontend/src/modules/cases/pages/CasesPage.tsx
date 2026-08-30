import React, { useState } from 'react';
import { useCaseList } from '../hooks/useCaseList';
import { CasesTable } from '../components/CasesTable';
import { CaseFilters } from '../components/CaseFilters';
import { CaseSearch } from '../components/CaseSearch';
import { CreateCaseModal } from '../components/CreateCaseModal';
import { Button } from '../../../components/ui/Button';
import { FolderPlus } from 'lucide-react';

export const CasesPage: React.FC = () => {
  const {
    cases,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    createNewCase,
  } = useCaseList();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Investigative Case Registry
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Official government repository of active digital evidence cases and authorized containers.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<FolderPlus className="w-4 h-4" />}
        >
          Initialize New Case
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded border border-slate-200">
        <CaseSearch value={search} onChange={setSearch} />
        <CaseFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />
      </div>

      <CasesTable cases={cases} isLoading={isLoading} />

      <CreateCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(c) => createNewCase(c as any)}
      />
    </div>
  );
};
