import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import type { ProductSearchCriteria } from '../backend';

interface HeaderSearchProps {
  onClose?: () => void;
}

export default function HeaderSearch({ onClose }: HeaderSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { actor } = useActor();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(
    async (value: string) => {
      if (!actor || !value.trim()) {
        setIsSearching(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsSearching(true);
        const criteria: ProductSearchCriteria = {
          searchBy: 'name',
          searchValue: value.trim(),
        };

        const results = await actor.searchProducts(criteria);
        
        // Navigate to search results page with query parameter
        window.location.href = `/buscar?q=${encodeURIComponent(value.trim())}`;
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error al buscar productos:', error);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [actor]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        handleSearch(value);
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      handleSearch(searchValue);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSearching(false);
    if (onClose) {
      onClose();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full" role="search">
      <label htmlFor="header-search" className="sr-only">
        Buscar productos
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          id="header-search"
          type="search"
          value={searchValue}
          onChange={handleInputChange}
          placeholder="Buscar productos…"
          className="w-full pl-10 pr-10 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          aria-label="Campo de búsqueda de productos"
          aria-describedby="search-description"
        />
        <span id="search-description" className="sr-only">
          Escribe para buscar productos. Los resultados aparecerán automáticamente.
        </span>
        {(searchValue || isSearching) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2" aria-live="polite" aria-atomic="true">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="sr-only">Buscando...</span>
          </div>
        )}
      </div>
    </form>
  );
}
