import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Search, FolderArchive, FileText, ArrowRight } from 'lucide-react';
import { useAppSelector } from '../../store';
import { ROUTES } from '../../config/routes.config';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const caseState = useAppSelector((state) => state.cases);
  const docState = useAppSelector((state) => state.documents);

  const cases = caseState?.cases || [];
  const documents = docState?.documents || [];

  if (!isOpen) return null;

  const q = (query || '').trim().toLowerCase();

  const matchedCases = (q && Array.isArray(cases))
    ? cases.filter(
        (c) =>
          (c?.caseNumber || '').toLowerCase().includes(q) ||
          (c?.title || '').toLowerCase().includes(q) ||
          (c?.description || '').toLowerCase().includes(q) ||
          (c?.referenceNumber || '').toLowerCase().includes(q)
      )
    : [];

  const matchedDocs = (q && Array.isArray(documents))
    ? documents.filter(
        (d) =>
          (d?.documentName || '').toLowerCase().includes(q) ||
          (d?.title || '').toLowerCase().includes(q) ||
          (d?.documentType || '').toLowerCase().includes(q) ||
          (d?.sha256Hash || '').toLowerCase().includes(q) ||
          (d?.caseNumber || '').toLowerCase().includes(q)
      )
    : [];

  const handleSelect = (path: string) => {
    try {
      navigate(path);
      onClose();
      setQuery('');
    } catch (e) {
      console.error("Navigation error:", e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Platform Search Engine" maxWidth="lg">
      <div className="space-y-4">
        <Input
          placeholder="Search real Case ID, Document Title, Hash..."
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {q.length > 0 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
            {/* Cases */}
            {matchedCases.length > 0 && (
              <div>
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                  <FolderArchive className="w-3.5 h-3.5 text-blue-700" /> Real Cases ({matchedCases.length})
                </div>
                <div className="space-y-1">
                  {matchedCases.map((c) => (
                    <div
                      key={c.id || c.caseNumber}
                      onClick={() => handleSelect(ROUTES.PROTECTED.CASES.DETAIL.replace(':caseId', c.id))}
                      className="p-2.5 rounded bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{c.caseNumber || 'N/A'} — {c.title || 'Untitled Case'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.referenceNumber || 'NO-REF'}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {matchedDocs.length > 0 && (
              <div>
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-700" /> Real Documents ({matchedDocs.length})
                </div>
                <div className="space-y-1">
                  {matchedDocs.map((d) => (
                    <div
                      key={d.id || d.documentName}
                      onClick={() => handleSelect(ROUTES.PROTECTED.DOCUMENTS.DETAIL.replace(':documentId', d.id))}
                      className="p-2.5 rounded bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{d.title || d.documentName || 'Untitled Document'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Case: {d.caseNumber || 'CASE-2026-Testing'} • SHA256: {(d.sha256Hash || '').slice(0, 16)}...
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedCases.length === 0 && matchedDocs.length === 0 && (
              <div className="p-6 text-center text-slate-500 font-medium">
                No matching real records found in database for "{query}".
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
