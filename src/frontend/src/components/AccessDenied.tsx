import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Copy, LogOut, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { terminateSessionWorker } from './DashboardHeader';

export default function AccessDenied() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const principalId = identity?.getPrincipal().toString() || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-900">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-4">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Acceso Denegado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              No tienes permisos de administrador
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tu ID Principal:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 font-mono break-all">
                  {principalId}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ¡Copiado al portapapeles!
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Contacta con un administrador y proporciona tu ID Principal para solicitar acceso.
              </p>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
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
        </footer>
      </div>
    </div>
  );
}
