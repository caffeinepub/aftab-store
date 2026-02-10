import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSearchProducts } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import ProductCard from './home/ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { Skeleton } from './ui/skeleton';
import type { Product, StoreDetails } from '../backend';

interface SearchBarProps {
  storeDetails?: StoreDetails;
  categoryMap: Map<string, { id: bigint; name: string }>;
}

const SearchBar = memo(({ storeDetails, categoryMap }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  const handleAutocompleteSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowAutocomplete(false);
  };

  const handleFullResultSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setDebouncedSearch('');
    setShowAutocomplete(false);
    setShowFullResults(false);
  };

  // Get category details for selected product
  const getCategoryDetails = (product: Product) => {
    const categoryInfo = categoryMap.get(product.categoryId.toString());
    return categoryInfo || { id: product.categoryId, name: 'Categoría' };
  };

  const products = searchResults?.products || [];
  const totalCount = searchResults?.totalCount || BigInt(0);
  const totalCountNumber = Number(totalCount);
  const hasMoreResults = totalCountNumber > 10;

  return (
    <>
      <div ref={searchContainerRef} className="relative w-full mb-8">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar productos por nombre o código de barras..."
              className="w-full pl-12 pr-4 py-4 text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              aria-label="Buscar productos"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </form>

        {/* Autocomplete Dropdown */}
        {showAutocomplete && !showFullResults && debouncedSearch && (
          <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
            {isLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-16 w-16 rounded" />
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
                    onClick={() => handleAutocompleteSelect(product)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-16 w-16 flex-shrink-0 rounded overflow-hidden border border-border">
                      <img
                        src={product.photo?.getDirectURL() || 'https://i.imgur.com/epm4DO1.jpeg'}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Código: {product.barcode}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Full Search Results */}
        {showFullResults && debouncedSearch && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Resultados de búsqueda
                {totalCountNumber > 0 && (
                  <span className="text-muted-foreground ml-2">
                    ({totalCountNumber} {totalCountNumber === 1 ? 'producto' : 'productos'})
                  </span>
                )}
              </h2>
              <button
                onClick={handleClearSearch}
                className="text-sm text-primary hover:underline"
              >
                Limpiar búsqueda
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.barcode}
                      product={product}
                      onSelect={handleFullResultSelect}
                    />
                  ))}
                </div>
                {hasMoreResults && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Mostrando los primeros 10 resultados de {totalCountNumber} productos encontrados.
                      Refina tu búsqueda para ver resultados más específicos.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && storeDetails && (
        <ProductDetailModal
          product={selectedProduct}
          storeDetails={storeDetails}
          categoryDetails={getCategoryDetails(selectedProduct)}
          open={!!selectedProduct}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
