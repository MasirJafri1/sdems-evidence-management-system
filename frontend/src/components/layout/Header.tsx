import React, { useState } from 'react';
import { Search, ShieldCheck, User, LogOut, Building } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../modules/auth/store/auth.slice';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { NotificationDropdown } from '../../modules/notifications/components/NotificationDropdown';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K keyboard listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full cursor-pointer" onClick={() => setIsSearchOpen(true)}>
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            readOnly
            placeholder="Search cases, OCR documents, serial numbers... (Ctrl + K)"
            className="w-full pl-9 pr-16 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none cursor-pointer hover:bg-slate-100/80 transition-colors"
          />
          <div className="absolute right-2.5 top-2 hidden sm:flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-300 rounded shadow-2xs">
              Ctrl
            </kbd>
            <span className="text-[10px] text-slate-400">+</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-300 rounded shadow-2xs">
              K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SECURE SESSION ACTIVE</span>
        </div>

        <NotificationDropdown />

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1.5">
                <span>{user.name}</span>
                {user.isSuperAdmin && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-red-100 text-red-800 font-bold rounded border border-red-200 uppercase tracking-wide">
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700">
                  {user.isSuperAdmin
                    ? 'Cross-Agency National Governance'
                    : user.organization?.name || 'Unassigned Officer (No Agency Affiliation)'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-mono text-[10px] text-slate-400">{user.email}</span>
              </div>
            </div>

            <div className="p-1.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
              <User className="w-4 h-4" />
            </div>

            <button
              onClick={() => dispatch(logout())}
              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {isSearchOpen && <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
    </header>
  );
};
