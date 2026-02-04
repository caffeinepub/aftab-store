import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllCategories } from '../hooks/useQueries';

export default function CategoriesDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: categories = [], isLoading } = useGetAllCategories();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const sortedCategories = [...categories].sort((a, b) => Number(a.order - b.order));

  const handleCategoryClick = (categoryId: string) => {
    navigate({ to: '/category', search: { id: categoryId } });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menú de categorías"
      >
        Categorías
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseLeave={() => setIsOpen(false)}
          role="menu"
          aria-label="Lista de categorías"
        >
          <div className="py-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Cargando...</div>
            ) : sortedCategories.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No hay categorías disponibles</div>
            ) : (
              sortedCategories.map((category) => (
                <button
                  key={category.id.toString()}
                  onClick={() => handleCategoryClick(category.id.toString())}
                  className="w-full text-left block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground"
                  role="menuitem"
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
