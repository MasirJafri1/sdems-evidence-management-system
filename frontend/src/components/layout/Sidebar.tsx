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
import { ENV } from '../../config/env.config';

export const Sidebar: React.FC = () => {
  const mainNav = [
    { label: 'Overview', path: ROUTES.PROTECTED.DASHBOARD, icon: LayoutDashboard },
    { label: 'Cases', path: ROUTES.PROTECTED.CASES.LIST, icon: FolderArchive },
    { label: 'Documents', path: ROUTES.PROTECTED.DOCUMENTS.LIST, icon: FileText },
    { label: 'Evidence', path: ROUTES.PROTECTED.EVIDENCE.LIST, icon: Box },
    { label: 'Custody', path: ROUTES.PROTECTED.CUSTODY.LIST, icon: GitCommit },
    { label: 'Verification', path: ROUTES.PROTECTED.VERIFICATION, icon: ShieldCheck },
    { label: 'Audit Log', path: ROUTES.PROTECTED.AUDIT, icon: History },
    { label: 'Reports', path: ROUTES.PROTECTED.REPORTS, icon: FileSpreadsheet },
    { label: 'Users & Roles', path: ROUTES.PROTECTED.USERS, icon: Users },
    { label: 'Settings', path: ROUTES.PROTECTED.SETTINGS, icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white text-slate-900 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-200 shadow-xs font-sans">
      <div>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 font-black text-white flex items-center justify-center text-xs tracking-wider shrink-0 shadow-xs border border-slate-800">
              GOV
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none font-heading">
                {ENV.APP_NAME}
              </h1>
              <p className="text-[10px] font-medium text-slate-600 leading-tight mt-1">
                {ENV.FULL_NAME}
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic">
            "{ENV.TAGLINE}"
          </div>
        </div>

        <nav className="p-3 space-y-0.5">
          <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            System Operations
          </div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-800 truncate">Central Bureau of Investigation</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>Security Status:</span>
          <span className="text-emerald-700 font-bold uppercase">COMPLIANT</span>
        </div>
      </div>
    </aside>
  );
};
