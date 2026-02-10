import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useGetProduct, useGetAllCategories, useGetStoreDetails } from '../hooks/useQueries';
import ProductDetailView from '../components/ProductDetailView';

export default function ProductDetailPage() {
  const { barcode } = useParams({ from: '/public-layout/product/$barcode' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const { data: product, isLoading: productLoading, isError: productError } = useGetProduct(barcode);
  const { data: categories = [] } = useGetAllCategories();
  const { data: storeDetails } = useGetStoreDetails();

  // Create category details object for ProductDetailView
  const categoryDetails = useMemo(() => {
    if (!product) return undefined;
    const category = categories.find((cat) => cat.id === product.categoryId);
    if (!category) return undefined;
    return {
      id: category.id,
      name: category.name
    };
  }, [product, categories]);

  // Scroll to top on mount and barcode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [barcode]);

  // Set page title dynamically
  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Aftab Retail`;
    } else {
      document.title = 'Producto - Aftab Retail';
    }

    return () => {
      document.title = 'Aftab Retail';
    };
  }, [product]);

  // Handle initial loading state
  useEffect(() => {
    if (!productLoading && product !== undefined) {
      setIsInitialLoading(false);
    }
  }, [productLoading, product]);

  // Fade in animation after data loads
  useEffect(() => {
    if (product && !isInitialLoading) {
      setTimeout(() => setFadeIn(true), 50);
    }
  }, [product, isInitialLoading]);

  // Cleanup on unmount: remove Product Detail page-owned queries
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['product'], exact: false });
    };
  }, [queryClient]);

  // Loading state
  if (isInitialLoading || productLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando producto...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-3xl font-bold text-foreground">
            Error al cargar el producto
          </h1>
          <p className="text-muted-foreground">
            Hubo un problema al cargar el producto. Por favor, intenta de nuevo más tarde.
          </p>
          <Button onClick={() => navigate({ to: '/' })} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-6xl">📦</div>
          <h1 className="text-3xl font-bold text-foreground">
            Producto no encontrado
          </h1>
          <p className="text-muted-foreground">
            {barcode ? (
              <>
                Lo sentimos, no pudimos encontrar el producto con el código de barras: <strong>{barcode}</strong>
              </>
            ) : (
              'No se proporcionó un código de barras válido.'
            )}
          </p>
          <Button onClick={() => navigate({ to: '/' })} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`max-w-[1200px] mx-auto px-4 sm:px-6 py-8 transition-opacity duration-500 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <ProductDetailView
        barcode={barcode}
        product={product}
        categoryDetails={categoryDetails}
        storeDetails={storeDetails}
        showBackButton={true}
      />
    </div>
  );
}
