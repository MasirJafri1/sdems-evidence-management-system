import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchCasesThunk, createCaseThunk } from '../store/case.slice';
import { createCaseSchema, type CreateCaseInput } from '../schemas/case.schema';
import { useToast } from '../../../components/feedback/useToast';

export const useCaseList = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const { cases, isLoading, error } = useAppSelector((state) => state.cases);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const targetOrgId = user?.organizationId || 'cmtfg5cer0000mh0w2bnhp068';

  const loadCases = () => {
    dispatch(fetchCasesThunk(targetOrgId));
  };

  useEffect(() => {
    loadCases();
  }, [dispatch, targetOrgId]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || (c.caseType && c.caseType.toLowerCase().includes(typeFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesType;
  });

  const createNewCase = async (input: CreateCaseInput): Promise<{ success: boolean; error?: string }> => {
    const validation = createCaseSchema.safeParse(input);
    if (!validation.success) {
      const err = validation.error.issues[0]?.message || 'Invalid case parameters';
      toast.error('Validation Error', err);
      return { success: false, error: err };
    }

    try {
      const actionResult = await dispatch(createCaseThunk({ orgId: targetOrgId, input }));
      if (createCaseThunk.fulfilled.match(actionResult)) {
        toast.success('Case Initialized', `Case ${actionResult.payload.caseNumber} registered in Redux state.`);
        return { success: true };
      } else {
        const errMsg = (actionResult.payload as string) || 'Case creation failed';
        toast.error('Case Creation Failed', errMsg);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      toast.error('Case Creation Failed', 'Unexpected error');
      return { success: false, error: 'Unexpected error' };
    }
  };

  return {
    cases: filteredCases,
    isLoading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    createNewCase,
    refreshCases: loadCases,
  };
};
