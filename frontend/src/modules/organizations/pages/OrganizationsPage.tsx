import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Building, ShieldCheck, Plus } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const orgs = [
    { id: 'org-1', name: 'Central Bureau of Investigation', code: 'CBI-001', members: 42, cases: 18, security: 'LEVEL 4 ENCRYPTION' },
    { id: 'org-2', name: 'Central Forensic Science Laboratory', code: 'CFSL-HQ', members: 28, cases: 24, security: 'LEVEL 4 ENCRYPTION' },
    { id: 'org-3', name: 'High Court Judicial Registry', code: 'HC-DEL', members: 15, cases: 31, security: 'JUDICIAL AUDIT' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
            <Building className="w-7 h-7 text-slate-900" />
            Authorized Departmental Organizations
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Multi-tenant organizational registry for law enforcement agencies, forensic labs, and judicial courts.
          </p>
        </div>

        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          Register New Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {orgs.map((o) => (
          <Card key={o.id} title={o.name} subtitle={`Code: ${o.code}`}>
            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Active Personnel:</span>
                <span className="font-bold text-slate-900">{o.members} Officers</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Active Cases:</span>
                <span className="font-bold text-slate-900">{o.cases} Containers</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Badge variant="success" size="sm"><ShieldCheck className="w-3 h-3 inline mr-1" />{o.security}</Badge>
                <Button variant="outline" size="sm">Manage Agency</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
