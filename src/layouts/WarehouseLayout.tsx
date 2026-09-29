import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

export const WarehouseLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column overflow-x-hidden w-100">
      {/* Fixed Header */}
      <Header onToggleSidebar={toggleSidebar} />

      {/* Main Layout Body */}
      <div className="d-flex flex-grow-1 position-relative w-100">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={sidebarOpen} onCloseMobile={closeSidebar} />

        {/* Content Area */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5 main-content-wrapper">
          <div className="container-fluid p-0 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
