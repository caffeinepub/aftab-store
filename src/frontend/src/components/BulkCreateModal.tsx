import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryNames: string[]) => void;
  isLoading?: boolean;
  existingCategoriesCount: number;
}

export default function BulkCreateModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  existingCategoriesCount,
}: BulkCreateModalProps) {
  const [inputText, setInputText] = useState('');

  const categoryNames = useMemo(() => {
    return inputText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [inputText]);

  const previewData = useMemo(() => {
    return categoryNames.map((name, index) => ({
      name,
      order: existingCategoriesCount + index + 1,
    }));
  }, [categoryNames, existingCategoriesCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryNames.length > 0) {
      onSave(categoryNames);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInputText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader>
            <DialogTitle>Creación Masiva de Categorías</DialogTitle>
            <DialogDescription>
              Ingresa una categoría por línea. Se asignarán órdenes automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-1 overflow-hidden">
            <div className="grid gap-2">
              <Label htmlFor="categories">Categorías</Label>
              <Textarea
                id="categories"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Una categoría por línea&#10;Ejemplo:&#10;Electrónica&#10;Ropa&#10;Alimentos"
                className="min-h-[120px] font-mono text-sm"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {categoryNames.length} categoría{categoryNames.length !== 1 ? 's' : ''} para crear
              </p>
            </div>

            {previewData.length > 0 && (
              <div className="grid gap-2 flex-1 overflow-hidden">
                <Label>Vista Previa</Label>
                <ScrollArea className="h-[200px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-24">Orden</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.order}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={categoryNames.length === 0 || isLoading}>
              {isLoading ? 'Creando...' : `Crear ${categoryNames.length} Categoría${categoryNames.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
