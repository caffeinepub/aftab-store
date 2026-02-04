import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import StoreBanner from '../components/StoreBanner';
import SearchBar from '../components/SearchBar';
import CategoriesDisplay from '../components/home/CategoriesDisplay';
import ProductDetailModal from '../components/ProductDetailModal';
import { useGetCategoriesWithProducts } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetCategoriesWithProducts(0, 5);

  useEffect(() => {
    if (isError) {
      setIsInitialLoading(false);
    } else if (!isLoading && data !== undefined) {
      setIsInitialLoading(false);
    }
  }, [isLoading, isError, data]);

  // Cleanup on unmount: remove Home-owned queries
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['categoriesWithProducts'] });
      // Reset selected barcode state
      setSelectedBarcode(null);
    };
  }, [queryClient]);

  const handleProductSelect = (barcode: string) => {
    setSelectedBarcode(barcode);
  };

  const handleCloseModal = () => {
    setSelectedBarcode(null);
  };

  return (
    <div className="w-full">
      <StoreBanner />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <SearchBar />
        
        {/* Initial Loading State */}
        {isInitialLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Cargando productos…</p>
          </div>
        )}

        {/* Error State */}
        {!isInitialLoading && isError && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No se encontraron productos</p>
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading && !isError && data && data.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No hay productos disponibles</p>
          </div>
        )}

        {/* Categories Display */}
        {!isInitialLoading && !isError && data && data.length > 0 && (
          <CategoriesDisplay onProductSelect={handleProductSelect} />
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedBarcode && (
        <ProductDetailModal
          barcode={selectedBarcode}
          open={!!selectedBarcode}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
