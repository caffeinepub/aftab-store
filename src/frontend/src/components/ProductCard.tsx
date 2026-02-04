import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import type { Product } from '../backend';

const DEFAULT_IMAGE = 'https://i.imgur.com/epm4DO1.jpeg';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
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
    navigate({ to: '/product/$barcode', params: { barcode: product.barcode } });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <button
        onClick={handleClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
      >
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
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">{product.barcode}</span>
            <Badge variant={product.inStock ? 'default' : 'destructive'} className="text-xs">
              {product.inStock ? '✓ En Stock' : '✗ Sin Stock'}
            </Badge>
          </div>
        </CardContent>
      </button>
    </Card>
  );
}
