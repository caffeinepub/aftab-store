import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import StoreBanner from '../components/StoreBanner';
import SearchBar from '../components/SearchBar';
import CategoriesDisplay from '../components/home/CategoriesDisplay';
import ProductDetailModal from '../components/ProductDetailModal';
import { useGetCategoriesWithProducts, useGetStoreDetails } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import type { Product, StoreDetails } from '../backend';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<bigint | null>(null);
  
  const { data: categoriesData, isLoading, isError } = useGetCategoriesWithProducts(0, 5);
  const { data: storeDetails } = useGetStoreDetails();

  useEffect(() => {
    if (isError) {
      setIsInitialLoading(false);
    } else if (!isLoading && categoriesData !== undefined) {
      setIsInitialLoading(false);
    }
  }, [isLoading, isError, categoriesData]);

  // Cleanup on unmount: remove Home-owned queries
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['categoriesWithProducts'], exact: false });
      queryClient.removeQueries({ queryKey: ['search'], exact: false });
    };
  }, [queryClient]);

  // Create category map for quick lookup
  const categoryMap = useMemo(() => {
    if (!categoriesData) return new Map();
    const map = new Map<string, { id: bigint; name: string }>();
    categoriesData.forEach(catWithProducts => {
      map.set(catWithProducts.category.id.toString(), {
        id: catWithProducts.category.id,
        name: catWithProducts.category.name
      });
    });
    return map;
  }, [categoriesData]);

  const handleProductSelect = (product: Product, categoryId: bigint) => {
    setSelectedProduct(product);
    setSelectedCategoryId(categoryId);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedCategoryId(null);
  };

  // Get category details for modal
  const categoryDetails = useMemo(() => {
    if (!selectedProduct || !selectedCategoryId) return null;
    const categoryInfo = categoryMap.get(selectedCategoryId.toString());
    if (categoryInfo) {
      return categoryInfo;
    }
    // Fallback: derive from product's categoryId
    const fallbackCategory = categoryMap.get(selectedProduct.categoryId.toString());
    return fallbackCategory || { id: selectedProduct.categoryId, name: 'Categoría' };
  }, [selectedProduct, selectedCategoryId, categoryMap]);

  return (
    <div className="w-full">
      <StoreBanner />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <SearchBar 
          storeDetails={storeDetails}
          categoryMap={categoryMap}
        />
        
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
        {!isInitialLoading && !isError && categoriesData && categoriesData.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No hay productos disponibles</p>
          </div>
        )}

        {/* Categories Display */}
        {!isInitialLoading && !isError && categoriesData && categoriesData.length > 0 && (
          <CategoriesDisplay onProductSelect={handleProductSelect} />
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && storeDetails && categoryDetails && (
        <ProductDetailModal
          product={selectedProduct}
          storeDetails={storeDetails}
          categoryDetails={categoryDetails}
          open={!!selectedProduct}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
