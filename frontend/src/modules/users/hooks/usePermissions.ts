import { useAppSelector } from '../../../store';

export type PermissionCode =
  | 'CASE_VIEW'
  | 'CASE_CREATE'
  | 'DOCUMENT_VIEW'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_DOWNLOAD'
  | 'EVIDENCE_VIEW'
  | 'EVIDENCE_REGISTER'
  | 'CUSTODY_TRANSFER'
  | 'AUDIT_VIEW'
  | 'BLOCKCHAIN_VERIFY';

export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.auth);

  const hasPermission = (code: PermissionCode): boolean => {
    if (!user) return false;
    if (code === 'AUDIT_VIEW' && user.email.includes('guest')) return false;
    return true;
  };

  return {
    hasPermission,
    canViewCases: hasPermission('CASE_VIEW'),
    canCreateCases: hasPermission('CASE_CREATE'),
    canUploadDocs: hasPermission('DOCUMENT_UPLOAD'),
    canDownloadDocs: hasPermission('DOCUMENT_DOWNLOAD'),
    canTransferCustody: hasPermission('CUSTODY_TRANSFER'),
    canViewAudit: hasPermission('AUDIT_VIEW'),
    canVerifyBlockchain: hasPermission('BLOCKCHAIN_VERIFY'),
  };
};
