import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllCategories } from '../hooks/useQueries';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useGetAllCategories();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedCategories = [...categories].sort((a, b) => Number(a.order - b.order));

  const handleCategoryClick = (categoryId: string) => {
    navigate({ to: '/category', search: { id: categoryId } });
    onClose();
  };

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background z-50 shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación móvil"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Navigation Links */}
            <nav className="p-4 space-y-1" aria-label="Navegación principal">
              <button
                onClick={() => handleNavigation('/')}
                className="w-full text-left block px-4 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Inicio
              </button>
              <button
                onClick={() => handleNavigation('/contacto')}
                className="w-full text-left block px-4 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Contacto
              </button>
            </nav>

            {/* Categories Section */}
            <div className="px-4 py-2 border-t border-border">
              <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Categorías
              </h3>
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">Cargando categorías...</div>
              ) : sortedCategories.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">No hay categorías disponibles</div>
              ) : (
                <nav className="space-y-1" aria-label="Categorías de productos">
                  {sortedCategories.map((category) => (
                    <button
                      key={category.id.toString()}
                      onClick={() => handleCategoryClick(category.id.toString())}
                      className="w-full text-left block px-4 py-3 text-base text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
