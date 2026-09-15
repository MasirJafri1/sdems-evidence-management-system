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
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-[#A66A00]/10 border border-[#A66A00]/30 rounded-md text-[#A66A00] font-medium flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-[#A66A00] shrink-0 mt-0.5" />
          <p>
            You are requesting access to a case outside of your immediate jurisdiction. 
            The Case Administrator must review and approve this request.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#17212B] uppercase tracking-wider">Case Number *</label>
          <input
            type="text"
            required
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="e.g. CASE-2026-Testing"
            className="w-full px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63] font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#17212B] uppercase tracking-wider">Reason for Access</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly state your purpose..."
            className="w-full px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#DCE3EA]">
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
