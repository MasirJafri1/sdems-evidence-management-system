import React, { useState } from 'react';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { useDocuments } from '../hooks/useDocuments';
import { Button } from '../../../components/ui/Button';
import { UploadCloud, Search } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { documents, isLoading, refreshDocuments } = useDocuments();
  const [search, setSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredDocuments = documents.filter(
    (d) =>
      d.documentName.toLowerCase().includes(search.toLowerCase()) ||
      d.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.sha256Hash.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3EA] pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#123B63] tracking-tight">
            Digital Evidence Documents Binder
          </h1>
          <p className="text-xs text-[#5B6875] mt-0.5">
            Cryptographically signed digital exhibits, chain of custody logs, and court-ready records.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
          size="sm"
        >
          Upload Evidence Document
        </Button>
      </div>

      <div className="bg-white p-3 rounded-md border border-[#DCE3EA] flex items-center gap-2 shadow-2xs">
        <Search className="w-4 h-4 text-[#5B6875]" />
        <input
          type="text"
          placeholder="Filter documents by name, case number, or SHA-256 digest..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-[#17212B] w-full focus:outline-none placeholder-[#5B6875]/70"
        />
      </div>

      <DocumentsTable documents={filteredDocuments} isLoading={isLoading} />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          refreshDocuments();
        }}
      />
    </div>
  );
};
