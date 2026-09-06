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

  const fetchEvidence = async () => {
    setIsLoading(true);
    try {
      const data = await getEvidenceListApi();
      if (Array.isArray(data)) {
        const mapped: MockEvidence[] = data.map((e) => ({
          id: e.id,
          evidenceNumber: e.evidenceNumber,
          caseId: e.caseId,
          caseNumber: e.case?.caseNumber || 'CASE-GENERAL',
          title: e.title,
          evidenceType: (e.documentVersion ? 'Storage Media' : 'Physical Item') as MockEvidence['evidenceType'],
          serialNumber: e.serialNumber || e.description || 'SN-VERIFIED',
          status: (e.status === 'ACTIVE'
            ? 'In Custody'
            : e.status === 'IN_TRANSFER'
            ? 'Transfer Pending'
            : e.status === 'RELEASED'
            ? 'Released'
            : e.status === 'ARCHIVED'
            ? 'Archived'
            : 'In Custody') as MockEvidence['status'],
          currentCustodian: e.currentCustodian?.name || e.createdBy?.name || user?.name || 'Authorized Custodian',
          custodianOrganization: user?.organization?.name || 'Department Custody Vault',
          storageLocation: e.storageLocation || 'Vault Locker A-1',
          dateCollected: e.createdAt,
          collectedBy: e.createdBy?.name || user?.name || 'Authorized Officer',
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
  }, [user?.organizationId]);

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
        caseNumber: created.case?.caseNumber || 'CASE-GENERAL',
        title: created.title,
        evidenceType: data.evidenceType as any,
        serialNumber: data.serialNumber,
        status: 'In Custody',
        currentCustodian: user?.name || 'Authorized Custodian',
        custodianOrganization: user?.organization?.name || 'Department Custody Vault',
        storageLocation: data.storageLocation,
        dateCollected: created.createdAt,
        collectedBy: user?.name || 'Authorized Officer',
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
