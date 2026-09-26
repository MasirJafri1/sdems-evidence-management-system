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
  X,
} from 'lucide-react';
import { ROUTES } from '../../config/routes.config';
import { useAppSelector } from '../../store';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-60 bg-[#F6F8FB] text-[#17212B] flex flex-col justify-between shrink-0 border-r border-[#DCE3EA] shadow-xl md:shadow-2xs font-sans transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="py-2 overflow-y-auto">
          {/* Mobile Sidebar Close Button Header */}
          <div className="flex md:hidden items-center justify-between px-3 py-2 border-b border-[#DCE3EA] mb-1">
            <span className="text-xs font-bold text-[#123B63]">SDEMS Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-[#5B6875] hover:bg-[#EBF3FA]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-2 space-y-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onCloseMobile?.()}
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
    </>
  );
};

