import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

import { ToastContainer } from '../feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#17212B] flex flex-col font-sans antialiased">
      {/* Top Header full-width navbar */}
      <Header />
      
      <div className="flex-1 flex min-w-0">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {pathParts.length > 0 && (
            <div className="bg-[#F6F8FB] border-b border-[#DCE3EA] px-6 py-2 text-[11px] text-[#5B6875] flex items-center gap-1.5 font-medium">
              <span className="font-bold text-[#123B63]">SDEMS PORTAL</span>
              {pathParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-[#DCE3EA]">/</span>
                  <span className="capitalize text-[#123B63] font-semibold">{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          <main className="flex-1 p-6 overflow-y-auto bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

