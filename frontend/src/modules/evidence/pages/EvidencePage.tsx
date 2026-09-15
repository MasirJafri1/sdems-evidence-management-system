import React, { useState } from 'react';
import { EvidenceTable } from '../components/EvidenceTable';
import { RegisterEvidenceModal } from '../components/RegisterEvidenceModal';
import { useEvidence } from '../hooks/useEvidence';
import { Button } from '../../../components/ui/Button';
import { PackagePlus, Search } from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const { evidenceList, isLoading, createEvidence } = useEvidence();
  const [search, setSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const filteredEvidence = evidenceList.filter((e) => {
    const s = search.toLowerCase();
    return (
      (e.title || '').toLowerCase().includes(s) ||
      (e.evidenceNumber || '').toLowerCase().includes(s) ||
      (e.serialNumber || '').toLowerCase().includes(s) ||
      (e.caseNumber || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight font-heading">
            Physical Evidence Registry
          </h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Tamper-evident physical property log, vault locations, and active chain of custody tracking.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsRegisterModalOpen(true)}
          leftIcon={<PackagePlus className="w-4 h-4" />}
        >
          Register Physical Item
        </Button>
      </div>

      <div className="bg-white p-3 rounded-md border border-[#DCE3EA] flex items-center gap-2 shadow-2xs">
        <Search className="w-4 h-4 text-[#5B6875]" />
        <input
          type="text"
          placeholder="Filter physical evidence by title, serial number, or item ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-[#17212B] w-full focus:outline-none placeholder-[#5B6875]/70"
        />
      </div>

      <EvidenceTable evidence={filteredEvidence} isLoading={isLoading} />

      <RegisterEvidenceModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={async (data) => {
          await createEvidence(data);
        }}
      />
    </div>
  );
};
