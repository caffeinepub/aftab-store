import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FolderTree, Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useGetAllCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategory,
} from '../../hooks/useQueries';
import { useToast } from '../../hooks/useToast';
import CategoryModal from '../CategoryModal';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import type { Category } from '../../backend';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useGetAllCategories();
  const addMutation = useAddCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategory();
  const toast = useToast();

  // Cleanup on unmount: remove Admin Categories page-owned queries
  useEffect(() => {
    return () => {
      // Categories are shared, so we don't remove them
      // But we reset local state
      setSearchTerm('');
      setSelectedCategory(null);
    };
  }, [queryClient]);

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    const filtered = categories.filter((cat) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cat.name.toLowerCase().includes(searchLower) ||
        cat.id.toString().includes(searchLower)
      );
    });
    return filtered.sort((a, b) => Number(a.order) - Number(b.order));
  }, [categories, searchTerm]);

  const handleAddCategory = async (name: string, order: string) => {
    try {
      const orderNum = order.trim() === '' ? BigInt(categories.length + 1) : BigInt(order);
      await addMutation.mutateAsync({ name, order: orderNum });
      toast.success('Categoría creada exitosamente');
      setIsAddModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la categoría');
    }
  };

  const handleEditCategory = async (name: string, order: string) => {
    if (!selectedCategory) return;
    try {
      const orderNum = order.trim() === '' ? selectedCategory.order : BigInt(order);
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        name,
        order: orderNum,
      });
      toast.success('Categoría actualizada exitosamente');
      setIsEditModalOpen(false);
      setSelectedCategory(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la categoría');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await deleteMutation.mutateAsync(selectedCategory.id);
      toast.success('Categoría eliminada exitosamente');
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Error al eliminar la categoría';
      if (errorMessage.includes('products') || errorMessage.includes('productos')) {
        toast.error('No se puede eliminar: la categoría tiene productos asociados');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleReorder = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = filteredCategories.findIndex((c) => c.id === category.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === filteredCategories.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapCategory = filteredCategories[swapIndex];

    try {
      await reorderMutation.mutateAsync({
        id: category.id,
        newOrder: swapCategory.order,
      });
      await reorderMutation.mutateAsync({
        id: swapCategory.id,
        newOrder: category.order,
      });
      toast.success('Orden actualizado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al reordenar categorías');
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <FolderTree className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Categorías</h2>
            <p className="text-gray-600 dark:text-gray-400">Organiza tus productos por categorías</p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Categoría
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Desktop Table / Mobile Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Cargando categorías...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <FolderTree className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {searchTerm ? 'No se encontraron categorías' : 'No hay categorías'}
            </p>
            <p className="text-sm mt-2">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza agregando tu primera categoría'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-32">Orden</TableHead>
                    <TableHead className="w-40 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category, index) => (
                    <TableRow key={category.id.toString()}>
                      <TableCell className="font-mono text-sm">{category.id.toString()}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{category.order.toString()}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReorder(category, 'up')}
                              disabled={index === 0 || reorderMutation.isPending}
                              title="Subir"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReorder(category, 'down')}
                              disabled={index === filteredCategories.length - 1 || reorderMutation.isPending}
                              title="Bajar"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(category)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => openDeleteDialog(category)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCategories.map((category, index) => (
                <div key={category.id.toString()} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {category.id.toString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Orden:</span>{' '}
                      <span className="text-gray-900 dark:text-white">{category.order.toString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleReorder(category, 'up')}
                        disabled={index === 0 || reorderMutation.isPending}
                        title="Subir"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleReorder(category, 'down')}
                        disabled={index === filteredCategories.length - 1 || reorderMutation.isPending}
                        title="Bajar"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(category)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => openDeleteDialog(category)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCategory}
        title="Agregar Categoría"
        isLoading={addMutation.isPending}
      />

      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        onSave={handleEditCategory}
        title="Editar Categoría"
        initialName={selectedCategory?.name}
        initialOrder={selectedCategory?.order.toString()}
        isLoading={updateMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Eliminar Categoría"
        description={`¿Estás seguro de que deseas eliminar la categoría "${selectedCategory?.name}"? Esta acción no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
