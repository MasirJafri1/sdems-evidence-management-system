import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

import { ToastContainer } from '../feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#17212B] flex flex-col font-sans antialiased">
      {/* Top Header full-width navbar */}
      <Header
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      <div className="flex-1 flex min-w-0 relative">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {pathParts.length > 0 && (
            <div className="bg-[#F6F8FB] border-b border-[#DCE3EA] px-3 sm:px-6 py-2 text-[11px] text-[#5B6875] flex items-center gap-1.5 font-medium overflow-x-auto whitespace-nowrap">
              <span className="font-bold text-[#123B63]">SDEMS PORTAL</span>
              {pathParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-[#DCE3EA]">/</span>
                  <span className="capitalize text-[#123B63] font-semibold">{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          <main className="flex-1 p-3 sm:p-6 overflow-y-auto bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

