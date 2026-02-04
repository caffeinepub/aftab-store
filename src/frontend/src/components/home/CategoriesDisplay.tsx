import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useActor } from '../../hooks/useActor';
import CategorySection from './CategorySection';
import { Loader2 } from 'lucide-react';
import type { CategoryWithProducts } from '../../backend';

const INITIAL_CATEGORIES_MOBILE = 3;
const INITIAL_CATEGORIES_DESKTOP = 5;
const LOAD_MORE_COUNT = 3;

interface CategoriesDisplayProps {
  onProductSelect?: (barcode: string) => void;
}

export default function CategoriesDisplay({ onProductSelect }: CategoriesDisplayProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [displayCount, setDisplayCount] = useState(INITIAL_CATEGORIES_MOBILE);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && displayCount < INITIAL_CATEGORIES_DESKTOP) {
        setDisplayCount(INITIAL_CATEGORIES_DESKTOP);
      }
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [displayCount]);

  useEffect(() => {
    if (!actor || actorFetching) return;

    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const result = await actor.getCategoriesWithProducts(BigInt(0), BigInt(50));
        setCategories(result);
        setHasMore(result.length > displayCount);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [actor, actorFetching, displayCount]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setDisplayCount((prev) => {
      const newCount = prev + LOAD_MORE_COUNT;
      setHasMore(newCount < categories.length);
      return newCount;
    });
  }, [isLoading, hasMore, categories.length]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore]);

  const displayedCategories = categories.slice(0, displayCount);

  return (
    <div className="space-y-12">
      {displayedCategories.map((categoryWithProducts) => (
        <CategorySection
          key={categoryWithProducts.category.id.toString()}
          categoryWithProducts={categoryWithProducts}
          onProductSelect={onProductSelect}
        />
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando más categorías...</span>
        </div>
      )}

      {!hasMore && categories.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Has visto todas las categorías</p>
        </div>
      )}
    </div>
  );
}
