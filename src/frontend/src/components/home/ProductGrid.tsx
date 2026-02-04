import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../../backend';

interface ProductGridProps {
  products: Product[];
  onProductSelect?: (barcode: string) => void;
}

export default function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const displayedProducts = isMobile ? products.slice(0, 4) : products.slice(0, 5);

  return (
    <div className="product-grid-5">
      {displayedProducts.map((product) => (
        <ProductCard key={product.barcode} product={product} onSelect={onProductSelect} />
      ))}
    </div>
  );
}
