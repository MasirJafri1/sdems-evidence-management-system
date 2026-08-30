import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

import { ToastContainer } from '../feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        {pathParts.length > 0 && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span>SDEMS</span>
            {pathParts.map((part, idx) => (
              <React.Fragment key={idx}>
                <span>/</span>
                <span className="capitalize text-slate-700 font-semibold">{part}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto bg-white">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
