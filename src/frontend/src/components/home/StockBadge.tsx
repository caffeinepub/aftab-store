import React from 'react';
import { Badge } from '../ui/badge';
import { Check, X } from 'lucide-react';

interface StockBadgeProps {
  inStock: boolean;
}

export default function StockBadge({ inStock }: StockBadgeProps) {
  if (inStock) {
    return (
      <Badge
        variant="default"
        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 text-xs px-2 py-0.5"
      >
        <Check className="w-3 h-3" />
        <span>En Stock</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 text-xs px-2 py-0.5"
    >
      <X className="w-3 h-3" />
      <span>Sin Stock</span>
    </Badge>
  );
}
