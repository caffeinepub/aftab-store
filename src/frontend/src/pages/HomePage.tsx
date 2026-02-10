import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import StoreBanner from '../components/StoreBanner';
import SearchBar from '../components/SearchBar';
import CategoriesDisplay from '../components/home/CategoriesDisplay';
import ProductDetailModal from '../components/ProductDetailModal';
import { useGetCategoriesWithProducts, useGetStoreDetails } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import type { ProductSelection } from '../types/productDetail';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedProductData, setSelectedProductData] = useState<ProductSelection | null>(null);
  const { data, isLoading, isError } = useGetCategoriesWithProducts(0, 5);
  const { data: storeDetails } = useGetStoreDetails();

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
      queryClient.removeQueries({ queryKey: ['categoriesWithProducts'], exact: false });
      queryClient.removeQueries({ queryKey: ['search'], exact: false });
    };
  }, [queryClient]);

  const handleProductSelect = (selection: ProductSelection) => {
    setSelectedProductData(selection);
  };

  const handleCloseModal = () => {
    setSelectedProductData(null);
  };

  return (
    <div className="w-full">
      <StoreBanner />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <SearchBar storeDetails={storeDetails} onProductSelect={handleProductSelect} />
        
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
      {selectedProductData && storeDetails && (
        <ProductDetailModal
          product={selectedProductData.product}
          storeDetails={storeDetails}
          categoryDetails={selectedProductData.categoryDetails}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
