import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchAllOrgDocumentsThunk } from '../store/document.slice';

export const useDocuments = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { documents, isLoading, error } = useAppSelector((state) => state.documents);

  const fetchAllDocuments = async () => {
    dispatch(fetchAllOrgDocumentsThunk());
  };

  useEffect(() => {
    fetchAllDocuments();
  }, [dispatch, user?.organizationId]);

  return {
    documents,
    isLoading,
    error,
    refreshDocuments: fetchAllDocuments,
  };
};

