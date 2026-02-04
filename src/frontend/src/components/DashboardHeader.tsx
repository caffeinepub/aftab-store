import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Menu, LogOut } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

// Module-level worker reference for lifecycle management
let sessionWorker: Worker | null = null;

// Initialize session worker
function initializeSessionWorker(): Worker | null {
  // Prevent duplicate initialization
  if (sessionWorker) {
    console.log('[Main] Session worker already running');
    return sessionWorker;
  }

  if (typeof Worker === 'undefined') {
    console.error('Web Workers are not supported in this browser');
    return null;
  }

  try {
    console.log('[Main] Starting session worker…');
    
    const worker = new Worker(new URL('../workers/session-worker.js', import.meta.url));
    
    // Listen for keep-alive messages from worker
    worker.addEventListener('message', (event) => {
      if (event.data.type === 'keep-alive') {
        // Dispatch synthetic mousemove event
        document.dispatchEvent(new Event('mousemove'));
      }
    });

    worker.addEventListener('error', (error) => {
      console.error('Session worker error:', error);
    });

    return worker;
  } catch (error) {
    console.error('Failed to initialize session worker:', error);
    return null;
  }
}

// Terminate session worker
export function terminateSessionWorker() {
  if (sessionWorker) {
    sessionWorker.postMessage({ type: 'stop' });
    sessionWorker.terminate();
    sessionWorker = null;
    console.log('[Worker] Session keep-alive terminated');
  }
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const workerInitialized = useRef(false);

  // Initialize session worker when component mounts
  useEffect(() => {
    if (!workerInitialized.current) {
      workerInitialized.current = true;
      sessionWorker = initializeSessionWorker();
      
      if (sessionWorker) {
        sessionWorker.postMessage({ type: 'start' });
      }
    }

    // Cleanup on unmount
    return () => {
      terminateSessionWorker();
      workerInitialized.current = false;
    };
  }, []);

  const handleLogout = async () => {
    // Terminate session worker
    terminateSessionWorker();
    
    // Clear authentication and cache
    await clear();
    queryClient.clear();
    
    // Navigate to login
    navigate({ to: '/admin' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="h-full flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="hidden lg:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Aftab Retail
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
