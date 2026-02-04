import { useState, useEffect } from 'react';
import { X, Copy, Upload, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SafeSelect, SelectItem, initializeSelectState } from './SafeSelect';
import { useToast } from '../hooks/useToast';
import type { Category, Product } from '../backend';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    barcode: string;
    name: string;
    categoryId: string;
    description: string;
    inStock: boolean;
    photo: File | null;
    isFeatured: boolean;
  }) => Promise<void>;
  title: string;
  categories: Category[];
  initialProduct?: Product | null;
  isLoading?: boolean;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  title,
  categories,
  initialProduct,
  isLoading = false,
}: ProductModalProps) {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const toast = useToast();
  const isEditMode = !!initialProduct;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Initialize form with product data
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setBarcode(initialProduct.barcode);
        setName(initialProduct.name);
        setCategoryId(initialProduct.categoryId.toString());
        setDescription(initialProduct.description || '');
        setInStock(initialProduct.inStock);
        setIsFeatured(initialProduct.isFeatured || false);
        setPhotoFile(null);
        setPhotoPreview(null);
        setExistingPhotoUrl(initialProduct.photo?.getDirectURL() || null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialProduct]);

  const resetForm = () => {
    setBarcode('');
    setName('');
    setCategoryId('none');
    setDescription('');
    setInStock(true);
    setIsFeatured(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles`);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const compressImageToWebP = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Calculate new dimensions (max 1200px width/height)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                });
                resolve(webpFile);
              } else {
                reject(new Error('Error al comprimir la imagen'));
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    try {
      setIsCompressing(true);
      const compressedFile = await compressImageToWebP(file);
      setPhotoFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
        setExistingPhotoUrl(null); // Clear existing photo when new one is selected
      };
      reader.readAsDataURL(compressedFile);

      toast.success('Imagen cargada y comprimida exitosamente');
    } catch (error) {
      toast.error('Error al procesar la imagen');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!barcode.trim()) {
      toast.error('El código de barras es obligatorio');
      return;
    }

    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (categoryId === 'none') {
      toast.error('Por favor, selecciona una categoría');
      return;
    }

    try {
      await onSave({
        barcode: barcode.trim(),
        name: name.trim(),
        categoryId,
        description: description.trim(),
        inStock,
        photo: photoFile,
        isFeatured,
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barcode */}
          <div className="space-y-2">
            <Label htmlFor="barcode">
              Código de barras <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ingresa el código de barras"
                disabled={isEditMode || isLoading}
                readOnly={isEditMode}
                className={`flex-1 ${isEditMode ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              />
              {barcode && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(barcode, 'Código de barras')}
                  title="Copiar código de barras"
                  className="flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa el nombre del producto"
                disabled={isLoading}
                className="flex-1"
              />
              {name && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(name, 'Nombre')}
                  title="Copiar nombre"
                  className="flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoría <span className="text-red-500">*</span>
            </Label>
            <SafeSelect
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="Selecciona una categoría"
              disabled={isLoading}
              className="scrollable-category-dropdown-trigger"
            >
              <SelectItem value="none">Selecciona una categoría</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SafeSelect>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <div className="flex flex-col gap-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingresa una descripción del producto (opcional)"
                disabled={isLoading}
                rows={3}
              />
              {description && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(description, 'Descripción')}
                  className="self-end"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar descripción
                </Button>
              )}
            </div>
          </div>

          {/* In Stock */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={inStock}
              onCheckedChange={(checked) => setInStock(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="inStock" className="cursor-pointer">
              En Stock
            </Label>
          </div>

          {/* Featured */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFeatured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="isFeatured" className="cursor-pointer">
              Marcar como producto destacado
            </Label>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Foto del producto</Label>
            <div className="space-y-4">
              {(photoPreview || existingPhotoUrl) && (
                <div className="relative w-full max-w-xs">
                  <img
                    src={photoPreview || existingPhotoUrl || ''}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading || isCompressing}
                  className="cursor-pointer flex-1"
                />
                {isCompressing && (
                  <div className="text-sm text-gray-500">Comprimiendo...</div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Formatos aceptados: JPG, PNG, WebP. Máximo 10MB. La imagen se comprimirá automáticamente.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isCompressing} className="w-full sm:w-auto">
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
