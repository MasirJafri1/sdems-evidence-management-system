import React from 'react';
import { usePermissions, type PermissionCode } from '../hooks/usePermissions';
import { PermissionDenied } from '../../../components/ui/FeedbackStates';

interface PermissionGateProps {
  permission: PermissionCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback,
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return (
      (fallback as any) || (
        <PermissionDenied reason={`Your account role lacks explicit authorization for ${permission}. Action restricted under security policy.`} />
      )
    );
  }

  return <>{children}</>;
};
