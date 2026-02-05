import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSearchProducts, useGetStoreDetails } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import ProductCard from './home/ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { Skeleton } from './ui/skeleton';
import type { Product } from '../backend';

const SearchBar = memo(() => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading } = useSearchProducts(debouncedSearch);
  const { data: storeDetails } = useGetStoreDetails();

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchValue.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearch(searchValue.trim());
        setShowAutocomplete(true);
      }, 300);
    } else {
      setDebouncedSearch('');
      setShowAutocomplete(false);
      setShowFullResults(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAutocomplete) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAutocomplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim().length >= 2) {
      setShowAutocomplete(false);
      setShowFullResults(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim().length >= 2) {
      e.preventDefault();
      setShowAutocomplete(false);
      setShowFullResults(true);
    }
  };

  const handleAutocompleteClick = (product: Product) => {
    setShowAutocomplete(false);
    setSelectedProduct(product);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const autocompleteResults = searchResults?.products.slice(0, 10) || [];
  const fullResults = searchResults?.products || [];
  const totalCount = searchResults?.totalCount ? Number(searchResults.totalCount) : 0;
  const displayFullResults = debouncedSearch.length >= 2 && showFullResults && !showAutocomplete;

  return (
    <>
      <div className="w-full space-y-6">
        {/* Search Input */}
        <div ref={searchContainerRef} className="relative w-full">
          <form onSubmit={handleSubmit} role="search">
            <label htmlFor="search-products" className="sr-only">
              Buscar productos
            </label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="search-products"
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar productos"
                className="w-full pl-12 pr-4 py-4 text-base bg-background border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm"
                aria-label="Campo de búsqueda de productos"
                aria-describedby="search-description"
                aria-autocomplete="list"
                aria-controls="autocomplete-results"
                aria-expanded={showAutocomplete}
              />
              <span id="search-description" className="sr-only">
                Escribe al menos 2 caracteres para buscar productos. Presiona Enter para ver todos los resultados.
              </span>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && debouncedSearch.length >= 2 && (
            <div
              id="autocomplete-results"
              className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
              role="listbox"
              aria-label="Sugerencias de búsqueda"
            >
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <span>Buscando...</span>
                </div>
              ) : autocompleteResults.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No se encontraron productos
                </div>
              ) : (
                <div className="py-2">
                  {autocompleteResults.map((product) => (
                    <button
                      key={product.barcode}
                      onClick={() => handleAutocompleteClick(product)}
                      className="w-full block px-4 py-3 hover:bg-accent transition-colors focus:outline-none focus:bg-accent text-left"
                      role="option"
                    >
                      <div className="flex items-center gap-3">
                        {product.photo && (
                          <img
                            src={product.photo.getDirectURL()}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{product.barcode}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full Search Results */}
        {displayFullResults && (
          <div className="space-y-6">
            {/* Results Count */}
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {isLoading ? (
                  'Buscando...'
                ) : fullResults.length === 0 ? (
                  'No se encontraron productos'
                ) : fullResults.length === 1 ? (
                  '1 resultado encontrado'
                ) : (
                  `${fullResults.length} resultados encontrados`
                )}
              </h2>
              {/* Helper message when more than 10 results exist */}
              {!isLoading && totalCount > 10 && (
                <p className="text-sm text-muted-foreground">
                  Mostrando los 10 primeros resultados. Refina tu búsqueda para más.
                </p>
              )}
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : fullResults.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No se encontraron productos</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {fullResults.map((product) => (
                  <ProductCard
                    key={product.barcode}
                    product={product}
                    onSelect={handleProductSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
