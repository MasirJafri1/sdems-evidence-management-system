import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileSpreadsheet, Download, Printer } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    { id: 'rep-1', title: 'Evidence Inventory Report', category: 'Inventory', description: 'Complete catalogue of seized physical items and storage locations.' },
    { id: 'rep-2', title: 'Chain of Custody Audit Trail', category: 'Forensic Audit', description: 'Sequential transfer history with cryptographic event hashes.' },
    { id: 'rep-3', title: 'Document Verification Ledger', category: 'Integrity Proof', description: 'SHA-256 fingerprint verification history and smart contract anchors.' },
    { id: 'rep-4', title: 'Departmental Audit Trail Export', category: 'Compliance', description: 'Full append-only audit event sequence export for legal discovery.' },
    { id: 'rep-5', title: 'Blockchain Anchors Log', category: 'Ledger Proof', description: 'Keccak-256 transaction hashes, block numbers, and timestamp proofs.' },
    { id: 'rep-6', title: 'Case Activity Summary', category: 'Executive Brief', description: 'High-level operational overview of active investigation progress.' },
    { id: 'rep-7', title: 'Access & Permission Matrix Report', category: 'Security Audit', description: 'Detailed report of explicit ABAC ALLOW and DENY rules.' },
  ];

  const handleDownload = (id: string) => {
    setDownloading(id);
    setTimeout(() => setDownloading(null), 800);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-slate-900" />
          Official Government Forensic Reports & Ledger Exports
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Generate certified PDF and CSV reports with embedded cryptographic integrity signatures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.id} title={r.title} subtitle={r.category}>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600">{r.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Badge variant="neutral" size="sm">PDF / CSV Export</Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" leftIcon={<Printer className="w-3.5 h-3.5" />}>Print</Button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={downloading === r.id}
                    onClick={() => handleDownload(r.id)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Certified Report
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
