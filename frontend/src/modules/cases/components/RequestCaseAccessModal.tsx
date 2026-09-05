import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { requestCaseAccessApi } from '../api/cases.api';
import { useToast } from '../../../components/feedback/useToast';
import { ShieldAlert, Send } from 'lucide-react';
import { mapApiError } from '../../../config/axios.config';

interface RequestCaseAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestCaseAccessModal: React.FC<RequestCaseAccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  const toast = useToast();
  const [caseNumber, setCaseNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim()) return;

    setIsSubmitting(true);
    try {
      await requestCaseAccessApi(caseNumber.trim(), reason.trim());
      toast.success('Access Request Sent', 'The case administrator has been notified of your request.');
      setCaseNumber('');
      setReason('');
      onClose();
    } catch (err: any) {
      toast.error('Request Failed', mapApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request External Case Access" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs font-medium flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            You are requesting access to a case outside of your immediate jurisdiction. 
            The Case Administrator must review and approve this request.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase">Case Number *</label>
          <input
            type="text"
            required
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="e.g. CASE-2026-Testing"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase">Reason for Access</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly state your purpose..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Send className="w-4 h-4" />}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
