import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GitCommit, ShieldAlert } from 'lucide-react';
import { useEvidence } from '../../evidence/hooks/useEvidence';
import { apiClient } from '../../../config/axios.config';

interface TransferInitiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (evidenceId: string, toCustodianEmail: string, toOrg: string, reason: string) => void;
  evidenceId?: string;
  isDocument?: boolean;
}

export const TransferInitiateModal: React.FC<TransferInitiateModalProps> = ({
  isOpen,
  onClose,
  onInitiate,
  evidenceId,
  isDocument
}) => {
  const { evidenceList } = useEvidence();
  
  const [selectedEvidence, setSelectedEvidence] = useState(evidenceId || '');
  const [toCustodianInput, setToCustodianInput] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState('');
  const [toOrg, setToOrg] = useState('');
  const [reason, setReason] = useState('Transfer item for forensic lab memory dump extraction.');
  
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState('');
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    if (evidenceId) {
      setSelectedEvidence(evidenceId);
    } else if (evidenceList.length > 0 && !selectedEvidence) {
      setSelectedEvidence(evidenceList[0].id);
    }
  }, [evidenceId, evidenceList, selectedEvidence]);

  const handleLookup = async () => {
    if (!toCustodianInput.trim()) return;
    setIsLookingUp(true);
    setLookupResult('');
    setLookupError('');
    setVerifiedUserId('');
    try {
      const res = await apiClient.post('/organizations/users/lookup', { query: toCustodianInput });
      if (res.data.found && res.data.user) {
        const u = res.data.user;
        const orgName = u.memberships?.[0]?.organization?.name || 'Unknown Department';
        setToOrg(orgName);
        setVerifiedUserId(u.id);
        setLookupResult(`Verified: ${u.name} (${orgName})`);
      }
    } catch (err: any) {
      setLookupError(err.response?.data?.message || 'Officer not found.');
      setToOrg('');
      setVerifiedUserId('');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence || !verifiedUserId || !toOrg || !reason) {
      if (!verifiedUserId) alert('Please Verify the officer email/ID before initiating transfer.');
      return;
    }
    onInitiate(selectedEvidence, verifiedUserId, toOrg, reason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Initiate Custody Handshake`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-[#A66A00]/10 border border-[#A66A00]/30 rounded-md text-[#A66A00] font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#A66A00] shrink-0" />
          <span>Double-sign-off required. Item will enter PENDING state until receiving custodian accepts.</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">{isDocument ? 'Select Document Exhibit' : 'Select Evidence Item'}</label>
          <select
            value={selectedEvidence}
            onChange={(e) => setSelectedEvidence(e.target.value)}
            disabled={!!evidenceId}
            className="px-3 py-2 bg-white border border-[#DCE3EA] rounded-md text-xs font-semibold text-[#17212B] disabled:bg-[#F6F8FB] focus:outline-none focus:ring-1 focus:ring-[#123B63]"
            required
          >
            {evidenceId ? (
               <option value={evidenceId}>{evidenceId}</option>
            ) : evidenceList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.evidenceNumber} — {e.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">Receiving Custodian Officer (Email / ID)</label>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input 
                label="" 
                value={toCustodianInput} 
                onChange={(e) => { setToCustodianInput(e.target.value); setLookupResult(''); setLookupError(''); setVerifiedUserId(''); }} 
                placeholder="Enter Email or Officer ID" 
                required 
              />
            </div>
            <Button type="button" variant="outline" onClick={handleLookup} disabled={isLookingUp || !toCustodianInput}>
              {isLookingUp ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
          {lookupResult && <div className="text-xs text-[#18794E] font-medium">{lookupResult}</div>}
          {lookupError && <div className="text-xs text-[#B42318] font-medium">{lookupError}</div>}
        </div>

        <Input label="Receiving Department / Organization" value={toOrg} onChange={(e) => setToOrg(e.target.value)} required />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">Reason & Purpose of Transfer</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="p-3 bg-white border border-[#DCE3EA] rounded-md text-xs min-h-[80px] text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63]" required />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<GitCommit className="w-4 h-4" />}>Initiate Transfer</Button>
        </div>
      </form>
    </Modal>
  );
};
