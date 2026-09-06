import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchDocumentsThunk } from '../store/document.slice';
import { getCasesApi } from '../../cases/api/cases.api';

export const useDocuments = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { documents, isLoading, error } = useAppSelector((state) => state.documents);

  const targetOrgId = user?.organizationId || 'all';

  const fetchAllDocuments = async () => {
    try {
      const cases = await getCasesApi(targetOrgId);
      if (Array.isArray(cases)) {
        for (const c of cases) {
          dispatch(fetchDocumentsThunk({ caseId: c.id, caseNumber: c.caseNumber }));
        }
      }
    } catch (err) {
      // handled in thunk
    }
  };

  useEffect(() => {
    fetchAllDocuments();
  }, [dispatch, targetOrgId]);

  return {
    documents,
    isLoading,
    error,
    refreshDocuments: fetchAllDocuments,
  };
};
