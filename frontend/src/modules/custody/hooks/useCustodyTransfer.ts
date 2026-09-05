import { useState } from 'react';
import { initiateTransferApi, acceptTransferApi, rejectTransferApi } from '../../evidence/api/evidence.api';
import { mapApiError } from '../../../config/axios.config';
import { useToast } from '../../../components/feedback/useToast';

export const useCustodyTransfer = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const startTransfer = async (evidenceId: string, toUserId: string, toOrganizationId: string, reason: string) => {
    setIsLoading(true);
    try {
      const result = await initiateTransferApi(evidenceId, { toUserId, toOrganizationId, reason });
      toast.security('Handshake Logged', `Physical custody transfer request logged in PENDING state.`);
      return { success: true, transfer: result.transfer };
    } catch (err: any) {
      const mapped = mapApiError(err);
      toast.error('Transfer Request Failed', mapped);
      return { success: false, error: mapped };
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTransfer = async (transferId: string) => {
    setIsLoading(true);
    try {
      await acceptTransferApi(transferId);
      toast.success('Handshake Verified', `Custody transfer accepted and committed to ledger.`);
      return { success: true };
    } catch (err: any) {
      const mapped = mapApiError(err);
      toast.error('Accept Transfer Failed', mapped);
      return { success: false, error: mapped };
    } finally {
      setIsLoading(false);
    }
  };

  const rejectTransfer = async (transferId: string, reason: string) => {
    setIsLoading(true);
    try {
      await rejectTransferApi(transferId, reason);
      toast.info('Transfer Declined', `Custody transfer request rejected.`);
      return { success: true };
    } catch (err: any) {
      const mapped = mapApiError(err);
      toast.error('Reject Transfer Failed', mapped);
      return { success: false, error: mapped };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    startTransfer,
    acceptTransfer,
    rejectTransfer,
  };
};
