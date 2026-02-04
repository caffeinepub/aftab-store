import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useProductDetail } from '../hooks/useProductDetail';
import ProductDetailView from './ProductDetailView';

interface ProductDetailModalProps {
  barcode: string;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ barcode, open, onClose }: ProductDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const {
    product,
    productLoading,
    productError,
    categoryName,
    storeDetails,
    isStoreDetailsLoading,
  } = useProductDetail(barcode);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Restore focus on close
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="product-detail-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="product-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="product-detail-modal-content">
          {/* Loading state */}
          {productLoading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Cargando producto...</p>
            </div>
          )}

          {/* Error state */}
          {!productLoading && productError && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Error al cargar el producto
              </h2>
              <p className="text-muted-foreground">
                Hubo un problema al cargar el producto. Por favor, intenta de nuevo más tarde.
              </p>
            </div>
          )}

          {/* Not found state */}
          {!productLoading && !productError && !product && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Producto no encontrado
              </h2>
              <p className="text-muted-foreground">
                Lo sentimos, no pudimos encontrar el producto con el código de barras: <strong>{barcode}</strong>
              </p>
            </div>
          )}

          {/* Product content */}
          {!productLoading && !productError && product && (
            <ProductDetailView
              barcode={barcode}
              product={product}
              categoryName={categoryName}
              storeDetails={storeDetails}
              isStoreDetailsLoading={isStoreDetailsLoading}
              showCloseButton={true}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
