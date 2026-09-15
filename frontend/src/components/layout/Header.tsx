import React, { useState, useRef, useEffect } from 'react';
import { Search, LogOut, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../modules/auth/store/auth.slice';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { NotificationDropdown } from '../../modules/notifications/components/NotificationDropdown';
import emblemPng from '../../assets/emblem.png';
import flagPng from '../../assets/flag.png';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'AO';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-[#DCE3EA] px-4 lg:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Emblem + Govt of India / MHA */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={emblemPng} alt="Government of India Emblem" className="h-11 w-auto object-contain" />
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-extrabold text-[#2F6B95] tracking-wider uppercase leading-tight">
              SIH PS : SIH26190 Given By 
            </span>
            <span className="text-[13px] font-bold text-[#123B63] tracking-tight font-serif leading-tight">
              Government of India
            </span>
            <span className="text-[10px] text-[#5B6875] font-medium leading-tight">
              Ministry of Home Affairs
            </span>
          </div>
        </div>

        <div className="h-9 w-[1px] bg-[#DCE3EA] mx-1 hidden sm:block" />
      </div>

      {/* Center: System Title + Slogan */}
      <div className="hidden md:flex flex-col items-center text-center mx-2 shrink">
        <h1 className="text-base lg:text-lg font-bold text-[#123B63] font-serif tracking-tight leading-tight">
          Secure Digital Evidence Management System
        </h1>
        <p className="text-[10px] lg:text-[11px] font-medium text-[#5B6875] tracking-wide mt-0.5">
          <span>Secure</span>
          <span className="mx-1.5 text-[#CBD5E1]">|</span>
          <span>Transparent</span>
          <span className="mx-1.5 text-[#CBD5E1]">|</span>
          <span>Accountable</span>
          <span className="mx-1.5 text-[#CBD5E1]">|</span>
          <span>For a Safer India</span>
        </p>
      </div>

      {/* Integrated Search Bar */}
      <div className="hidden xl:block w-64 lg:w-72 cursor-pointer mx-2" onClick={() => setIsSearchOpen(true)}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5B6875]" />
          <input
            type="text"
            readOnly
            placeholder="Search cases, evidence... (Ctrl + K)"
            className="w-full pl-8 pr-14 py-1.5 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md text-xs text-[#17212B] placeholder-[#5B6875]/70 focus:outline-none cursor-pointer hover:bg-white transition-colors"
          />
          <div className="absolute right-2 top-1.5 flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#5B6875] bg-white border border-[#DCE3EA] rounded shadow-2xs">
              Ctrl
            </kbd>
            <span className="text-[9px] text-[#5B6875]">+</span>
            <kbd className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#5B6875] bg-white border border-[#DCE3EA] rounded shadow-2xs">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Flag Logo + User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search icon button for smaller screens */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="xl:hidden p-2 text-[#5B6875] hover:text-[#123B63] hover:bg-[#F6F8FB] rounded-md border border-transparent hover:border-[#DCE3EA]"
          title="Search (Ctrl + K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Digital Evidence / Stronger Justice Flag Section */}
        <div className="hidden lg:flex items-center gap-2.5">
          <img src={flagPng} alt="Digital Evidence Logo" className="h-8 w-auto object-contain" />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-[#123B63] leading-tight">
              Digital Evidence
            </span>
            <span className="text-[11px] font-semibold text-[#2F6B95] leading-tight">
              Stronger Justice
            </span>
          </div>
        </div>

        <div className="h-9 w-[1px] bg-[#DCE3EA] mx-1 hidden lg:block" />

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Avatar & Dropdown */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-[#F6F8FB] transition-colors border border-transparent hover:border-[#DCE3EA]"
            >
              <div className="w-8 h-8 rounded-full bg-[#123B63] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1 text-xs font-bold text-[#123B63]">
                  <span>{user.name || 'Anjali Sharma'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#5B6875] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[10px] font-medium text-[#5B6875]">
                  {user.isSuperAdmin ? 'Super Admin' : (user.role || 'Senior Investigator')}
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#DCE3EA] rounded-md shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-[#DCE3EA]">
                  <p className="text-xs font-bold text-[#123B63]">{user.name}</p>
                  <p className="text-[11px] text-[#5B6875] truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold bg-[#EBF3FA] text-[#123B63] rounded border border-[#B8D3EA] uppercase">
                    {user.isSuperAdmin ? 'Super Admin' : user.role || 'Officer'}
                  </span>
                </div>
                <div className="px-4 py-2 border-b border-[#DCE3EA] text-[11px] text-[#5B6875]">
                  <p className="font-semibold text-[#17212B]">Organization:</p>
                  <p className="truncate">{user.organization?.name || 'Cross-Agency National Governance'}</p>
                </div>
                <div className="px-2 pt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      dispatch(logout());
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FEF3F2] rounded flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isSearchOpen && <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
    </header>
  );
};

