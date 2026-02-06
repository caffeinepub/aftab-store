import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useGetAllCategories, useGetStoreDetails } from '../hooks/useQueries';
import ProductDetailView from './ProductDetailView';
import type { Product } from '../backend';

interface ProductDetailModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, open, onClose }: ProductDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const historyPushedRef = useRef(false);
  const isClosingRef = useRef(false);

  const { data: categories = [] } = useGetAllCategories();
  const { data: storeDetails } = useGetStoreDetails();

  const categoryName = categories.find(
    (cat) => cat.id === product.categoryId
  )?.name;

  const isStoreDetailsLoading = !storeDetails;

  // Unified close handler
  const handleClose = useRef(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (historyPushedRef.current) {
      // Use history.back() to trigger popstate event
      window.history.back();
    } else {
      // Direct close if no history was pushed
      onClose();
    }

    // Reset closing state after delay
    setTimeout(() => {
      isClosingRef.current = false;
    }, 100);
  }).current;

  // Handle popstate events
  useEffect(() => {
    if (!open) return;

    const handlePopState = () => {
      // Reset history flag and close modal
      historyPushedRef.current = false;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open, onClose]);

  // Push history state when modal opens
  useEffect(() => {
    if (open) {
      window.history.pushState({ modalOpen: true }, '');
      historyPushedRef.current = true;
    }
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      historyPushedRef.current = false;
      isClosingRef.current = false;
    };
  }, []);

  if (!open) return null;

  // Validate required product fields
  const hasRequiredFields = product && product.barcode && product.name && product.categoryId !== undefined;

  return (
    <div
      className="product-detail-modal-overlay"
      onClick={handleClose}
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
          {/* Invalid product state */}
          {!hasRequiredFields && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Datos de producto incompletos
              </h2>
              <p className="text-muted-foreground">
                No se pudieron cargar los datos del producto correctamente.
              </p>
            </div>
          )}

          {/* Product content */}
          {hasRequiredFields && (
            <ProductDetailView
              barcode={product.barcode}
              product={product}
              categoryName={categoryName}
              storeDetails={storeDetails}
              isStoreDetailsLoading={isStoreDetailsLoading}
              showCloseButton={true}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
