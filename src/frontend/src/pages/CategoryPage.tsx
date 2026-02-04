import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useGetCategoryById, useGetCategoryProductsPaginated } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import ProductCard from '../components/home/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';

const PRODUCTS_PER_PAGE = 15;
const SCROLL_THRESHOLD = 500;
const COOLDOWN_MS = 300;

export default function CategoryPage() {
  const search = useSearch({ from: '/public-layout/category' });
  const categoryId = search.id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Fetch category details
  const { data: category } = useGetCategoryById(categoryId);

  // Fetch initial products
  const { data: productsData, isLoading: isInitialLoading, isError } = useGetCategoryProductsPaginated(
    categoryId,
    0,
    PRODUCTS_PER_PAGE
  );

  // Scroll to top on category change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  // Reset state when categoryId changes
  useEffect(() => {
    setAllProducts([]);
    setOffset(0);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [categoryId]);

  // Initialize products from first fetch
  useEffect(() => {
    if (productsData && offset === 0) {
      setAllProducts(productsData.products);
      setOffset(productsData.products.length);
      setHasMore(productsData.products.length < Number(productsData.totalCount));
    }
  }, [productsData, offset]);

  // Cleanup on unmount: remove Category-owned queries
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['category', categoryId] });
      queryClient.removeQueries({ queryKey: ['categoryProducts', categoryId] });
      // Reset local state
      setAllProducts([]);
      setOffset(0);
      setHasMore(true);
      setSelectedBarcode(null);
    };
  }, [queryClient, categoryId]);

  const loadMoreProducts = useCallback(async () => {
    if (!categoryId || loadingRef.current || !hasMore) return;

    const now = Date.now();
    if (now - lastLoadTimeRef.current < COOLDOWN_MS) {
      return;
    }

    loadingRef.current = true;
    lastLoadTimeRef.current = now;
    setIsLoadingMore(true);

    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['categoryProducts', categoryId, offset, PRODUCTS_PER_PAGE],
        queryFn: async () => {
          const actor = (window as any).__actor__;
          if (!actor) throw new Error('Actor not available');
          return actor.getCategoryProductsPaginated(
            BigInt(categoryId),
            BigInt(offset),
            BigInt(PRODUCTS_PER_PAGE),
            null
          );
        },
      });

      const newProducts = result.products;
      const total = Number(result.totalCount);

      setAllProducts((prev) => [...prev, ...newProducts]);
      const newOffset = offset + newProducts.length;
      setOffset(newOffset);
      setHasMore(newOffset < total);
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [categoryId, offset, hasMore, queryClient]);

  // Infinite scroll handler
  useEffect(() => {
    if (!hasMore || isInitialLoading || isLoadingMore) return;

    const handleScroll = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

        if (distanceToBottom < SCROLL_THRESHOLD && hasMore && !loadingRef.current) {
          loadMoreProducts();
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [hasMore, isInitialLoading, isLoadingMore, loadMoreProducts]);

  const handleProductSelect = (barcode: string) => {
    setSelectedBarcode(barcode);
  };

  const handleCloseModal = () => {
    setSelectedBarcode(null);
  };

  const getProductCountText = (count: number) => {
    return count === 1 ? '1 producto' : `${count} productos`;
  };

  if (isInitialLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-destructive text-lg font-medium">Error al cargar los productos</p>
          <Button onClick={() => navigate({ to: '/' })} variant="outline">
            Volver a inicio
          </Button>
        </div>
      </div>
    );
  }

  const totalCount = productsData ? Number(productsData.totalCount) : 0;

  return (
    <>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate({ to: '/' })}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1"
          aria-label="Volver a inicio"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a categorías</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {category?.name || 'Categoría'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {getProductCountText(totalCount)}
          </p>
        </div>

        {allProducts.length === 0 && !isInitialLoading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground text-lg">
              No hay productos en esta categoría
            </p>
          </div>
        )}

        {allProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {allProducts.map((product) => (
                <ProductCard
                  key={product.barcode}
                  product={product}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>

            {isLoadingMore && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-muted-foreground">Cargando más productos...</p>
                </div>
              </div>
            )}

            {!hasMore && allProducts.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground text-center">
                  Has visto todos los productos de esta categoría
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedBarcode && (
        <ProductDetailModal
          barcode={selectedBarcode}
          open={!!selectedBarcode}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
