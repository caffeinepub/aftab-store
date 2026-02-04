import { useState, useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
import DashboardHeader from './DashboardHeader';
import SidebarNavigation from './SidebarNavigation';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile on page load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleMenuItemClick = () => {
    // Auto-close sidebar on mobile when menu item is clicked
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        <SidebarNavigation isOpen={sidebarOpen} onMenuItemClick={handleMenuItemClick} />
        
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64' : 'ml-0'
          } pt-16`}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 py-4 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © 2025. Construido con{' '}
          <span className="text-red-500">♥</span> usando{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
