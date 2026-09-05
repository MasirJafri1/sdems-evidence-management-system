import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileSpreadsheet, Download, Printer } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const [reports] = useState<any[]>([]);


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

      {reports.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-300 bg-slate-50 rounded-lg text-center space-y-2">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Reports Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Forensic audit reports and ledger exports will appear here automatically as active cases, documents, and chain-of-custody transfers are recorded.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );

};
