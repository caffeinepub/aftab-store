import { useNavigate, useLocation } from '@tanstack/react-router';
import { Home, Package, FolderTree, Users, Store, Upload } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarNavigationProps {
  isOpen: boolean;
  onMenuItemClick?: () => void;
}

const navItems = [
  { path: '/admin', label: 'Inicio', icon: Home },
  { path: '/admin/products', label: 'Productos', icon: Package },
  { path: '/admin/categories', label: 'Categorías', icon: FolderTree },
  { path: '/admin/admin-users', label: 'Administradores', icon: Users },
  { path: '/admin/store-details', label: 'Detalles de Tienda', icon: Store },
  { path: '/admin/import', label: 'Importar', icon: Upload },
];

export default function SidebarNavigation({ isOpen, onMenuItemClick }: SidebarNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    if (onMenuItemClick) {
      onMenuItemClick();
    }
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
          onClick={onMenuItemClick}
        />
      )}
    </>
  );
}
