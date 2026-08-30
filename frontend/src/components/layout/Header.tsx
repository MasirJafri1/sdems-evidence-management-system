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

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full cursor-pointer" onClick={() => setIsSearchOpen(true)}>
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            readOnly
            placeholder="Search cases, document hashes, evidence IDs... (Click to search)"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none cursor-pointer"
          />
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
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                <Building className="w-3 h-3 text-slate-400" />
                {user.email}
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
