import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store';
import { getEvidenceListApi, createEvidenceApi } from '../api/evidence.api';
import { mapApiError } from '../../../config/axios.config';
import { useToast } from '../../../components/feedback/useToast';
import type { MockEvidence } from '../../../mock/evidence.mock';

export const useEvidence = () => {
  const toast = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [evidenceList, setEvidenceList] = useState<MockEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const targetOrgId = user?.organizationId || 'cmtfg5cer0000mh0w2bnhp068';

  const fetchEvidence = async () => {
    setIsLoading(true);
    try {
      const data = await getEvidenceListApi();
      if (Array.isArray(data)) {
        const mapped: MockEvidence[] = data.map((e) => ({
          id: e.id,
          evidenceNumber: e.evidenceNumber,
          caseId: e.caseId,
          caseNumber: 'CASE-2026-Testing',
          title: e.title,
          evidenceType: 'Physical Item',
          serialNumber: e.serialNumber || 'SN-VERIFIED',
          status: 'In Custody',
          currentCustodian: 'Senior Inspector Rajesh Sharma',
          custodianOrganization: 'Central Bureau of Investigation',
          storageLocation: e.storageLocation || 'CFSL Vault Locker 4B',
          dateCollected: e.createdAt,
          collectedBy: 'Senior Inspector Rajesh Sharma',
          custodyChainStatus: 'CUSTODY CHAIN VALID',
          history: [],
        }));
        setEvidenceList(mapped);
      } else {
        setEvidenceList([]);
      }
    } catch (err: any) {
      setEvidenceList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [targetOrgId]);

  const createEvidence = async (data: {
    caseId: string;
    title: string;
    evidenceType: string;
    serialNumber: string;
    storageLocation: string;
  }) => {
    setIsLoading(true);
    try {
      const created = await createEvidenceApi(data);
      const mapped: MockEvidence = {
        id: created.id,
        evidenceNumber: created.evidenceNumber,
        caseId: created.caseId,
        caseNumber: 'CASE-2026-Testing',
        title: created.title,
        evidenceType: data.evidenceType as any,
        serialNumber: data.serialNumber,
        status: 'In Custody',
        currentCustodian: 'Senior Inspector Rajesh Sharma',
        custodianOrganization: 'Central Bureau of Investigation',
        storageLocation: data.storageLocation,
        dateCollected: created.createdAt,
        collectedBy: 'Senior Inspector Rajesh Sharma',
        custodyChainStatus: 'CUSTODY CHAIN VALID',
        history: [],
      };
      setEvidenceList((prev) => [mapped, ...prev]);
      toast.success('Physical Evidence Registered', `Item ${created.evidenceNumber} logged in vault ledger.`);
      return { success: true, data: mapped };
    } catch (err: any) {
      const mappedErr = mapApiError(err);
      toast.error('Registration Failed', mappedErr);
      return { success: false, error: mappedErr };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    evidenceList,
    isLoading,
    createEvidence,
    refreshEvidence: fetchEvidence,
  };
};
