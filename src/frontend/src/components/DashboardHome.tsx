import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardCards from './DashboardCards';

export default function DashboardHome() {
  const queryClient = useQueryClient();

  // Cleanup on unmount: Dashboard home doesn't own specific queries
  // But we reset any transient state if needed
  useEffect(() => {
    return () => {
      // No specific queries to remove for dashboard home
    };
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Control
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Bienvenido al sistema de gestión de Aftab Store
        </p>
      </div>

      <DashboardCards />
    </div>
  );
}
