import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';

export default function LoginInterface() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Aftab Store
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema de Gestión Administrativa
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Iniciar Sesión
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Utiliza Internet Identity para acceder de forma segura
            </p>
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
