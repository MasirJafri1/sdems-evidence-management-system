import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import {
  Search,
  FileText,
  Package,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Fingerprint,
  ShieldCheck
} from 'lucide-react';
import { ROUTES } from '../../config/routes.config';
import { apiClient } from '../../config/axios.config';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchHit {
  id: string;
  entityType: 'DOCUMENT' | 'EVIDENCE';
  title: string;
  caseId: string;
  caseNumber: string;
  serialNumber?: string;
  evidenceType?: string;
  documentType?: string;
  versionNumber?: number;
  sha256Hash?: string;
  highlightSnippet?: string;
  score: number;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState<'ALL' | 'DOCUMENT' | 'EVIDENCE'>('ALL');
  const [useAi, setUseAi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLatencyMs, setAiLatencyMs] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [scopeInfo, setScopeInfo] = useState<{ isSuperAdmin?: boolean; isOrgAdmin?: boolean; authorizedCaseCount?: any } | null>(null);

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      performSearch(query, entityType, useAi);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, entityType, useAi, isOpen]);

  // Global Ctrl+K / Cmd+K listener handled by parent or header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performSearch = async (q: string, type: string, ai: boolean) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/search', {
        params: {
          q: q.trim(),
          type,
          useAi: ai,
          limit: 25
        }
      });

      const data = res.data;
      setHits(Array.isArray(data.hits) ? data.hits : []);
      setTotalCount(typeof data.total === 'number' ? data.total : (data.hits?.length || 0));
      setAiSummary(data.aiSummary || null);
      setAiLatencyMs(data.aiLatencyMs || null);
      setScopeInfo(data.scope || null);
    } catch (err) {
      console.error('Search request failed:', err);
      setHits([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (hit: SearchHit) => {
    if (hit.entityType === 'DOCUMENT') {
      navigate(ROUTES.PROTECTED.DOCUMENTS.DETAIL.replace(':documentId', hit.id));
    } else {
      navigate(ROUTES.PROTECTED.EVIDENCE.DETAIL.replace(':evidenceId', hit.id));
    }
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SDEMS Elastic Search & Intelligence" maxWidth="xl">
      <div className="space-y-4">
        {/* Search input bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, OCR contents, forensic serials, document hashes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            {isLoading && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
            <span className="text-[10px] font-mono text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300">
              ESC to close
            </span>
          </div>
        </div>

        {/* Filter chips & AI Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-100 pb-2 text-xs">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'DOCUMENT', 'EVIDENCE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setEntityType(type)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  entityType === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Records' : type === 'DOCUMENT' ? 'Documents' : 'Physical Evidence'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseAi(!useAi)}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                useAi
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
              }`}
              title="Leverage Groq LLaMA 3.3 for court-admissible forensic synthesis"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Groq AI</span>
              {useAi && <Badge variant="success" size="sm">ACTIVE</Badge>}
            </button>
          </div>
        </div>

        {/* User Scope Indicator */}
        {scopeInfo && (
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>Zero-Trust Scope:</strong>{' '}
                {scopeInfo.isSuperAdmin
                  ? 'Global Visibility (Superadmin)'
                  : scopeInfo.isOrgAdmin
                    ? 'All Cases in Your Agency'
                    : `Restricted to ${scopeInfo.authorizedCaseCount} Assigned Case(s)`}
              </span>
            </div>
            {totalCount !== null && (
              <span className="font-mono text-slate-500 font-semibold">{totalCount} result{totalCount === 1 ? '' : 's'}</span>
            )}
          </div>
        )}

        {/* Groq AI Synthesis Box */}
        {useAi && aiSummary && (
          <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-purple-900">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Forensic Intelligence Synthesis (Groq LLaMA-3.3)</span>
              </div>
              {aiLatencyMs && (
                <span className="text-[10px] font-mono text-purple-600 font-normal">
                  ⚡ {aiLatencyMs}ms
                </span>
              )}
            </div>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line text-[11px] bg-white/70 p-2.5 rounded border border-purple-100">
              {aiSummary}
            </p>
          </div>
        )}

        {/* Results list */}
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
          {hits.length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-500 text-xs">
              <p className="font-semibold text-slate-700">No records found matching "{query}".</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Only records within your assigned cases and agency boundary are searchable.
              </p>
            </div>
          )}

          {hits.map((hit) => (
            <div
              key={hit.id}
              onClick={() => handleSelect(hit)}
              className="p-3 rounded hover:bg-blue-50/70 border border-transparent hover:border-blue-200 cursor-pointer transition-colors flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  {hit.entityType === 'DOCUMENT' ? (
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Package className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-900">
                    {hit.title}
                  </span>
                  <Badge variant={hit.entityType === 'DOCUMENT' ? 'info' : 'warning'} size="sm">
                    {hit.entityType === 'DOCUMENT' ? `v${hit.versionNumber || 1}.0` : hit.evidenceType || 'EXHIBIT'}
                  </Badge>
                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {hit.caseNumber}
                  </span>
                </div>

                {hit.highlightSnippet && (
                  <div className="space-y-0.5">
                    <p
                      className="text-[11px] text-slate-600 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: hit.highlightSnippet }}
                    />
                    {hit.highlightSnippet.includes("<mark") && (
                      <span className="inline-block text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        ✓ In-file Content Match
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono pt-0.5">
                  {hit.serialNumber && <span>SN: {hit.serialNumber}</span>}
                  {hit.sha256Hash && (
                    <span className="flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-slate-400" />
                      SHA: {hit.sha256Hash.slice(0, 16)}...
                    </span>
                  )}
                  <span>Score: {hit.score.toFixed(2)}</span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
