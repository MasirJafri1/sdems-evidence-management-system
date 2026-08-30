import React, { useState } from 'react';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { useDocuments } from '../hooks/useDocuments';
import { Button } from '../../../components/ui/Button';
import { UploadCloud, Search } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { documents, refreshDocuments } = useDocuments();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Digital Evidence Documents Binder
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Cryptographically signed digital exhibits, chain of custody logs, and court-ready records.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          Upload Evidence Document
        </Button>
      </div>

      <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter documents by name, case number, or SHA-256 digest..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-slate-900 w-full focus:outline-none"
        />
      </div>

      <DocumentsTable documents={filteredDocuments} />

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
