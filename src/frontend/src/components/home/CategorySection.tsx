import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import ProductGrid from './ProductGrid';
import type { CategoryWithProducts, Product } from '../../backend';

interface CategorySectionProps {
  categoryWithProducts: CategoryWithProducts;
  onProductSelect?: (product: Product) => void;
}

export default function CategorySection({ categoryWithProducts, onProductSelect }: CategorySectionProps) {
  const navigate = useNavigate();
  const { category, products, productCount } = categoryWithProducts;

  const handleViewAll = () => {
    navigate({ to: '/category', search: { id: category.id.toString() } });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {Number(productCount)} {Number(productCount) === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        {Number(productCount) > 5 && (
          <button
            onClick={handleViewAll}
            className="text-primary hover:underline font-medium text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
          >
            Ver todos →
          </button>
        )}
      </div>
      <ProductGrid products={products} onProductSelect={onProductSelect} />
    </section>
  );
}
