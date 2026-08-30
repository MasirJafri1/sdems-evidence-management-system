import React from 'react';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';

interface CaseStatusBadgeProps {
  status: string;
}

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({ status }) => {
  const getVariant = (s: string): BadgeVariant => {
    switch (s) {
      case 'Active':
        return 'success';
      case 'Under Review':
        return 'warning';
      case 'Pending Verification':
        return 'info';
      case 'Closed':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return <Badge variant={getVariant(status)} size="sm">{status}</Badge>;
};
