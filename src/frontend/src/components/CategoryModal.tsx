import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, order: string) => void;
  title: string;
  initialName?: string;
  initialOrder?: string;
  isLoading?: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialName = '',
  initialOrder = '',
  isLoading = false,
}: CategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setOrder(initialOrder);
    }
  }, [isOpen, initialName, initialOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), order.trim());
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {initialName ? 'Modifica los datos de la categoría.' : 'Completa los datos de la nueva categoría.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="Orden de visualización (opcional)"
                disabled={isLoading}
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Si no se especifica, se asignará automáticamente
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
