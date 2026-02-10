import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Copy, Share2, ArrowLeft, Check, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { formatWhatsAppApiNumber } from '../utils/phoneFormatter';
import type { Product, StoreDetails } from '../backend';

const DEFAULT_IMAGE = 'https://i.imgur.com/epm4DO1.jpeg';

interface ProductDetailViewProps {
  barcode: string;
  product: Product;
  categoryDetails?: {
    id: bigint;
    name: string;
  };
  storeDetails?: StoreDetails;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function ProductDetailView({
  barcode,
  product,
  categoryDetails,
  storeDetails,
  showBackButton = false,
  showCloseButton = false,
  onClose,
}: ProductDetailViewProps) {
  const navigate = useNavigate();
  const { success } = useToast();

  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Handle image loading
  useEffect(() => {
    setIsImageLoading(true);

    if (!product.photo) {
      setImageSrc(DEFAULT_IMAGE);
      setIsImageLoading(false);
      return;
    }

    const photoUrl = product.photo.getDirectURL();
    setImageSrc(photoUrl);
  }, [product.photo, product.barcode]);

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setImageSrc(DEFAULT_IMAGE);
    setIsImageLoading(false);
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcode);
    success('Código de barras copiado');
  };

  const handleShareUrl = () => {
    const url = `${window.location.origin}/product/${barcode}`;
    navigator.clipboard.writeText(url);
    success('URL copiada al portapapeles');
  };

  const handleContactWhatsApp = () => {
    const whatsappNumber = storeDetails?.whatsapp || '695250655';
    const whatsappUrl = `https://wa.me/${formatWhatsAppApiNumber(whatsappNumber)}`;
    const message = encodeURIComponent(`Hola, estoy interesado en el producto: ${product.name} (Código: ${barcode})`);
    window.open(`${whatsappUrl}?text=${message}`, '_blank');
  };

  const isStoreDetailsLoading = !storeDetails;

  return (
    <div className="w-full">
      {/* Header with Back/Close Button */}
      <div className="flex items-center justify-between mb-6">
        {/* Back Button (left side) */}
        {showBackButton && (
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        )}

        {/* Spacer when no back button */}
        {!showBackButton && <div />}

        {/* Close Button (right side) */}
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            className="-mr-2"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <img
              key={`${barcode}-${Date.now()}`}
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <span className="text-sm text-muted-foreground">Cargando imagen...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Product Name */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Featured Badge */}
          {product.isFeatured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-950 flex items-center gap-2 text-base px-4 py-2 w-fit">
              <span>⭐</span>
              <span>Destacado</span>
            </Badge>
          )}

          {/* Category */}
          {categoryDetails && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Categoría:</span>
              <button
                onClick={() => navigate({ to: '/category', search: { id: categoryDetails.id.toString() } })}
                className="text-primary hover:underline font-medium"
              >
                {categoryDetails.name}
              </button>
            </div>
          )}

          {/* Barcode */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <span className="text-xs text-muted-foreground block mb-1">Código de barras</span>
              <span className="font-mono text-lg font-semibold">{barcode}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyBarcode}
              className="shrink-0"
              aria-label="Copiar código de barras"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Stock Badge */}
          <div>
            {product.inStock ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 text-base px-4 py-2 w-fit">
                <Check className="w-5 h-5" />
                <span>EN STOCK</span>
              </Badge>
            ) : (
              <Badge className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-base px-4 py-2 w-fit">
                <X className="w-5 h-5" />
                <span>SIN STOCK</span>
              </Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Descripción</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleContactWhatsApp}
              className="w-full text-base py-6"
              size="lg"
              disabled={isStoreDetailsLoading}
              style={{ opacity: isStoreDetailsLoading ? 0.6 : 1 }}
            >
              Contactar sobre este producto
            </Button>
            <Button
              variant="outline"
              onClick={handleShareUrl}
              className="w-full"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir producto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
