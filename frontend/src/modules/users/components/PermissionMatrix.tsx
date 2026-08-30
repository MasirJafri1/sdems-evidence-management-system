import React from 'react';
import type { MockPermissionRule } from '../../../mock/users.mock';
import { Badge } from '../../../components/ui/Badge';
import { CheckCircle2, Ban, GitBranch } from 'lucide-react';

interface PermissionMatrixProps {
  permissions: MockPermissionRule[];
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ permissions }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
            <th className="p-3">Permission Code</th>
            <th className="p-3">Description & Scope</th>
            <th className="p-3 text-center">Effect State</th>
            <th className="p-3">Scope Boundary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium bg-white">
          {permissions.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="p-3 font-mono font-bold text-slate-900">{p.permissionName}</td>
              <td className="p-3 text-slate-700 font-medium">{p.description}</td>
              <td className="p-3 text-center">
                {p.effect === 'ALLOW' ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    ALLOW
                  </Badge>
                ) : p.effect === 'DENY' ? (
                  <Badge variant="danger" size="sm">
                    <Ban className="w-3 h-3 inline mr-1" />
                    DENY
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    <GitBranch className="w-3 h-3 inline mr-1" />
                    INHERITED
                  </Badge>
                )}
              </td>
              <td className="p-3 font-semibold text-slate-800">{p.scope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
