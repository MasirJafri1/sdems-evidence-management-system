import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchCasesThunk, createCaseThunk } from '../store/case.slice';
import { createCaseSchema, type CreateCaseInput } from '../schemas/case.schema';
import { useToast } from '../../../components/feedback/useToast';
import { getOrganizationsApi } from '../../organizations/api/organization.api';

export interface SimpleOrg {
  id: string;
  name: string;
  code: string;
}

export const useCaseList = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { cases, isLoading, error } = useAppSelector((state) => state.cases);

  const urlOrgId = searchParams.get('orgId');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedOrgId, setSelectedOrgId] = useState(urlOrgId || 'ALL');
  const [organizations, setOrganizations] = useState<SimpleOrg[]>([]);

  useEffect(() => {
    getOrganizationsApi()
      .then((orgs) => {
        if (Array.isArray(orgs)) {
          setOrganizations(orgs.map((o: any) => ({ id: o.id, name: o.name, code: o.code })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (urlOrgId && urlOrgId !== selectedOrgId) {
      setSelectedOrgId(urlOrgId);
    }
  }, [urlOrgId]);

  const loadCases = (orgIdFilter: string) => {
    const apiOrgId = orgIdFilter === 'ALL' ? 'all' : orgIdFilter;
    dispatch(fetchCasesThunk(apiOrgId));
  };

  useEffect(() => {
    loadCases(selectedOrgId);
  }, [dispatch, selectedOrgId]);

  const handleSelectOrgId = (newOrgId: string) => {
    setSelectedOrgId(newOrgId);
    if (newOrgId === 'ALL') {
      searchParams.delete('orgId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ orgId: newOrgId });
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || (c.caseType && c.caseType.toLowerCase().includes(typeFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesType;
  });

  const targetOrgIdForCreate =
    (selectedOrgId !== 'ALL' ? selectedOrgId : null) ||
    user?.organizationId ||
    organizations[0]?.id ||
    'cmtfg5cer0000mh0w2bnhp068';

  const createNewCase = async (input: CreateCaseInput): Promise<{ success: boolean; error?: string }> => {
    const validation = createCaseSchema.safeParse(input);
    if (!validation.success) {
      const err = validation.error.issues[0]?.message || 'Invalid case parameters';
      toast.error('Validation Error', err);
      return { success: false, error: err };
    }

    try {
      const actionResult = await dispatch(createCaseThunk({ orgId: targetOrgIdForCreate, input }));
      if (createCaseThunk.fulfilled.match(actionResult)) {
        toast.success('Case Initialized', `Case ${actionResult.payload.caseNumber} registered in database.`);
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
    selectedOrgId,
    setSelectedOrgId: handleSelectOrgId,
    organizations,
    createNewCase,
    refreshCases: () => loadCases(selectedOrgId),
  };
};
