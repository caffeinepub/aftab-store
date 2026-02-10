import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import StockBadge from './StockBadge';
import { Star } from 'lucide-react';
import type { Product } from '../../backend';

const DEFAULT_IMAGE = 'https://i.imgur.com/epm4DO1.jpeg';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (!product.photo) {
      setImageSrc(DEFAULT_IMAGE);
      setIsLoading(false);
      return;
    }

    const photoUrl = product.photo.getDirectURL();
    setImageSrc(photoUrl);
  }, [product.photo, product.barcode]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageSrc(DEFAULT_IMAGE);
    setIsLoading(false);
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(product);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 hover:scale-[1.02] group">
      <button
        onClick={handleClick}
        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
      >
        {/* Product Image */}
        <div className="relative aspect-square">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <span className="text-xs text-muted-foreground">Cargando...</span>
            </div>
          )}
          {/* Featured Badge */}
          {product.isFeatured && (
            <div
              className="featured-badge"
              role="img"
              aria-label="Producto destacado"
            >
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-semibold">Destacado</span>
            </div>
          )}
          {/* Stock Badge */}
          <div className="absolute top-2 right-2">
            <StockBadge inStock={product.inStock} />
          </div>
        </div>

        {/* Product Info */}
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {product.description}
            </p>
          )}
        </CardContent>
      </button>
    </Card>
  );
}
