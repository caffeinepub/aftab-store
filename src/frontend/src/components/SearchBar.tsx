import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSearchProducts } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import ProductCard from './home/ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { Skeleton } from './ui/skeleton';
import type { Product, StoreDetails } from '../backend';
import type { ProductSelection } from '../types/productDetail';

interface SearchBarProps {
  storeDetails?: StoreDetails;
  onProductSelect?: (selection: ProductSelection) => void;
}

const SearchBar = memo(({ storeDetails, onProductSelect }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState<ProductSelection | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: searchResults, isLoading } = useSearchProducts(debouncedSearch);

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

  const handleAutocompleteClick = (product: Product) => {
    const selection: ProductSelection = {
      product,
      categoryDetails: {
        id: product.categoryId.toString(),
        name: undefined, // Search results don't include category name
      },
    };

    setShowAutocomplete(false);
    
    if (onProductSelect) {
      onProductSelect(selection);
    } else {
      setSelectedProductData(selection);
    }
  };

  const handleFullResultClick = (product: Product) => {
    const selection: ProductSelection = {
      product,
      categoryDetails: {
        id: product.categoryId.toString(),
        name: undefined, // Search results don't include category name
      },
    };

    if (onProductSelect) {
      onProductSelect(selection);
    } else {
      setSelectedProductData(selection);
    }
  };

  const handleCloseModal = () => {
    setSelectedProductData(null);
  };

  const products = searchResults?.products || [];
  const totalCount = searchResults?.totalCount || 0;
  const showHelper = totalCount > 10;

  return (
    <>
      <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-12 pr-4 py-4 text-base border-2 border-border rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground placeholder:text-muted-foreground"
              aria-label="Buscar productos"
            />
          </div>
        </form>

        {/* Google-style Autocomplete Dropdown */}
        {showAutocomplete && debouncedSearch && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
            {isLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No se encontraron productos
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <div className="py-2">
                {products.map((product) => (
                  <button
                    key={product.barcode}
                    onClick={() => handleAutocompleteClick(product)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-border">
                      <img
                        src={product.photo?.getDirectURL() || 'https://i.imgur.com/epm4DO1.jpeg'}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Search Results Grid */}
      {showFullResults && debouncedSearch && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Resultados de búsqueda
              {totalCount > 0 && (
                <span className="text-muted-foreground ml-2">({totalCount})</span>
              )}
            </h2>
            <button
              onClick={() => {
                setShowFullResults(false);
                setSearchValue('');
                setDebouncedSearch('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                No se encontraron productos para "{debouncedSearch}"
              </p>
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.barcode}
                    product={product}
                    onSelect={() => handleFullResultClick(product)}
                  />
                ))}
              </div>

              {showHelper && (
                <div className="mt-6 p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Mostrando los primeros 10 resultados de {totalCount} productos encontrados.
                    Refina tu búsqueda para ver resultados más específicos.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Product Detail Modal (when not using parent callback) */}
      {selectedProductData && storeDetails && (
        <ProductDetailModal
          product={selectedProductData.product}
          storeDetails={storeDetails}
          categoryDetails={selectedProductData.categoryDetails}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
