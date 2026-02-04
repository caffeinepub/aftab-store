import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import CategoriesDropdown from './CategoriesDropdown';
import MobileMenu from './MobileMenu';

export default function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-40 w-full bg-background border-b border-border shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <a
              href="/"
              className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              aria-label="Ir a la página de inicio"
            >
              <img
                src="https://i.imgur.com/g1czHOM.png"
                alt="Logo de la tienda"
                className="h-10 w-auto object-contain"
              />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 ml-auto" aria-label="Navegación principal">
              <a
                href="/"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1"
              >
                Inicio
              </a>
              <CategoriesDropdown />
              <a
                href="/contacto"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1"
              >
                Contacto
              </a>
            </nav>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-2 ml-auto">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                aria-label="Abrir menú"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
