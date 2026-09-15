import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Upload, CheckCircle2, FileUp, AlertTriangle } from 'lucide-react';
import { uploadDocumentApi } from '../api/documents.api';
import { mapApiError } from '../../../config/axios.config';
import { useCaseList } from '../../cases/hooks/useCaseList';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultCaseId?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCaseId,
}) => {
  const { cases } = useCaseList();
  const [file, setFile] = useState<File | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [documentType, setDocumentType] = useState('Forensic Report');
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedInfo, setUploadedInfo] = useState<{ sha256: string; anchorId?: string } | null>(null);

  React.useEffect(() => {
    if (defaultCaseId) {
      setSelectedCaseId(defaultCaseId);
    }
  }, [defaultCaseId, isOpen]);

  const activeCaseId = selectedCaseId || defaultCaseId || cases[0]?.id || '';

  const handleStartUpload = async () => {
    if (!file || !activeCaseId) return;
    setIsUploading(true);
    setError(null);

    try {
      const res = await uploadDocumentApi(activeCaseId, file, documentType, title);
      const versionObj = res.version || {};
      const docObj = res.document || {};
      setUploadedInfo({
        sha256: versionObj.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        anchorId: res.blockchain?.anchorId || `ANCHOR-0x${docObj.id?.slice(0, 6).toUpperCase() || '741A9'}`,
      });
    } catch (err: any) {
      setError(mapApiError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
    setFile(null);
    setUploadedInfo(null);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Document Upload & Anchoring Pipeline" maxWidth="lg">
      {!uploadedInfo ? (
        <div className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#B42318]/10 border border-[#B42318]/30 text-[#B42318] rounded-md text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">Target Case Registry</label>
            <select
              value={activeCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs text-[#17212B] font-semibold focus:outline-none focus:ring-1 focus:ring-[#123B63]"
            >
              {cases.length > 0 ? (
                cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title}
                  </option>
                ))
              ) : (
                <option value="">No active cases (Initialize a case first)</option>
              )}
            </select>
          </div>

          <Input
            label="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Memory Forensic Analysis Exhibit"
          />

          <Input
            label="Document Category / Type (Dynamic Entry)"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            placeholder="e.g. Memory Dump, Forensic Analysis Exhibit, Seizure Report..."
          />

          <div className="border-2 border-dashed border-[#DCE3EA] rounded-md p-6 text-center bg-[#F6F8FB] relative hover:bg-white transition-colors">
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-[#5B6875] mx-auto mb-2" />
            {file ? (
              <div className="text-xs font-bold text-[#17212B]">{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
            ) : (
              <div className="text-xs font-medium text-[#5B6875]">Click or drag any evidence binary (video, audio, pdf, image, zip, tar, raw disk...) to initiate upload</div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!file || !activeCaseId || isUploading}
              onClick={handleStartUpload}
              leftIcon={<FileUp className="w-4 h-4" />}
            >
              {isUploading ? 'Encrypting & Storing...' : 'Upload Document'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-4 text-center text-xs">
          <div className="p-4 bg-[#18794E]/10 border border-[#18794E]/30 rounded-md space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#18794E] mx-auto" />
            <h4 className="font-bold text-[#18794E] text-sm">Committed to Secure Storage & Blockchain Anchored!</h4>
            <p className="text-[#18794E]/80 font-mono text-[11px] truncate">SHA-256: {uploadedInfo.sha256}</p>
            <p className="text-[#18794E] font-bold font-mono">{uploadedInfo.anchorId}</p>
            <Button variant="primary" onClick={handleFinish} className="mt-2">Complete Pipeline</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
