import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  productName: string;
  isLoading?: boolean;
}

export default function DeleteProductDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isLoading = false,
}: DeleteProductDialogProps) {
  const [password, setPassword] = useState('');
  const REQUIRED_PASSWORD = 'DeleteIsUnsafe';

  const handleConfirm = async () => {
    if (password === REQUIRED_PASSWORD) {
      try {
        await onConfirm(password);
        setPassword('');
      } catch (error) {
        // Error handling is done in parent component
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const isPasswordValid = password === REQUIRED_PASSWORD;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              ¿Estás seguro de que deseas eliminar el producto <strong>"{productName}"</strong>?
            </p>
            <p className="text-red-600 dark:text-red-400 font-medium">
              Esta acción no se puede deshacer.
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="deletePassword">
                Para confirmar, escribe: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">DeleteIsUnsafe</code>
              </Label>
              <Input
                id="deletePassword"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe la contraseña aquí"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isPasswordValid || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
