import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderArchive,
  FileText,
  Box,
  GitCommit,
  ShieldCheck,
  History,
  FileSpreadsheet,
  Users,
  Settings,
  Building,
} from 'lucide-react';
import { ROUTES } from '../../config/routes.config';

import { useAppSelector } from '../../store';

// ... inside Sidebar component:
export const Sidebar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const activeOrgName = user?.isSuperAdmin || !user?.organizationId
    ? 'National Evidence Governance Board'
    : 'Registered Government Agency';

  const mainNav = [
    { label: 'Overview', path: ROUTES.PROTECTED.DASHBOARD, icon: LayoutDashboard },
    { label: 'Cases', path: ROUTES.PROTECTED.CASES.LIST, icon: FolderArchive },
    { label: 'Documents', path: ROUTES.PROTECTED.DOCUMENTS.LIST, icon: FileText },
    { label: 'Evidence', path: ROUTES.PROTECTED.EVIDENCE.LIST, icon: Box },
    { label: 'Custody', path: ROUTES.PROTECTED.CUSTODY.LIST, icon: GitCommit },
    { label: 'Access Requests', path: ROUTES.PROTECTED.ACCESS_REQUESTS, icon: ShieldCheck },
    { label: 'Organizations', path: ROUTES.PROTECTED.ORGANIZATIONS, icon: Building },
    { label: 'Verification', path: ROUTES.PROTECTED.VERIFICATION, icon: ShieldCheck },
    { label: 'Audit Log', path: ROUTES.PROTECTED.AUDIT, icon: History },
    { label: 'Reports', path: ROUTES.PROTECTED.REPORTS, icon: FileSpreadsheet },
    { label: 'Users & Roles', path: ROUTES.PROTECTED.USERS, icon: Users },
    { label: 'Settings', path: ROUTES.PROTECTED.SETTINGS, icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#F6F8FB] text-[#17212B] flex flex-col justify-between shrink-0 border-r border-[#DCE3EA] shadow-2xs font-sans">
      <div className="py-2">
        <nav className="p-2 space-y-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-[#EBF3FA] text-[#123B63] font-bold'
                      : 'text-[#5B6875] hover:bg-white hover:text-[#123B63] font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-1 bg-[#123B63] rounded-r-md" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#123B63]' : 'text-[#5B6875]'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 border-t border-[#DCE3EA] bg-white space-y-1.5 text-[11px] text-[#5B6875]">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-[#2F6B95] shrink-0" />
          <span className="font-bold text-[#123B63] truncate">{activeOrgName}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span>Security Status:</span>
          <span className="text-[#18794E] uppercase bg-[#E6F4ED] px-1.5 py-0.5 rounded border border-[#B2DDCE]">
            COMPLIANT
          </span>
        </div>
      </div>
    </aside>
  );
};

