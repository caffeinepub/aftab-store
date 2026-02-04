import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Pencil, Trash2, Copy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetProducts,
  useGetAllCategories,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleStock,
  useUpdateProductFeaturedStatus,
} from '../../hooks/useQueries';
import { useToast } from '../../hooks/useToast';
import { ExternalBlob } from '../../backend';
import ProductModal from '../ProductModal';
import DeleteProductDialog from '../DeleteProductDialog';
import type { Product, Category } from '../../backend';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Abort previous request when search changes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearch, categoryFilter, featuredOnly]);

  // Cleanup on unmount: remove Admin Products page-owned queries
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['products'] });
      // Reset local state
      setSearchTerm('');
      setDebouncedSearch('');
      setCategoryFilter('all');
      setFeaturedOnly(false);
      setCurrentPage(0);
      setSelectedProduct(null);
    };
  }, [queryClient]);

  const categoryIdFilter = categoryFilter === 'all' ? null : categoryFilter === 'none' ? BigInt(0) : BigInt(categoryFilter);

  const { data: productsData, isLoading } = useGetProducts(
    currentPage,
    pageSize,
    debouncedSearch,
    categoryIdFilter,
    featuredOnly
  );

  const { data: categories = [] } = useGetAllCategories();
  const addMutation = useAddProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const toggleStockMutation = useToggleStock();
  const updateFeaturedMutation = useUpdateProductFeaturedStatus();

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages ? Number(productsData.totalPages) : 1;
  const totalCount = productsData?.totalCount ? Number(productsData.totalCount) : 0;

  // Get category name by ID
  const getCategoryName = (categoryId: bigint): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles`);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  // Handle stock toggle
  const handleToggleStock = async (barcode: string, currentStock: boolean) => {
    try {
      await toggleStockMutation.mutateAsync(barcode);
      toast.success(`Stock ${!currentStock ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el stock');
    }
  };

  // Handle featured toggle
  const handleToggleFeatured = async (barcode: string, currentFeatured: boolean) => {
    setTogglingFeatured(barcode);
    try {
      await updateFeaturedMutation.mutateAsync({ barcode, isFeatured: !currentFeatured });
      toast.success(
        !currentFeatured ? 'Producto marcado como destacado' : 'Producto quitado de destacados'
      );
    } catch (error: any) {
      toast.error(error.message || 'No se pudo actualizar el estado destacado');
    } finally {
      setTogglingFeatured(null);
    }
  };

  // Handle add product
  const handleAddProduct = async (productData: {
    barcode: string;
    name: string;
    categoryId: string;
    description: string;
    inStock: boolean;
    photo: File | null;
    isFeatured: boolean;
  }) => {
    try {
      let photoBlob: ExternalBlob | undefined = undefined;
      if (productData.photo) {
        const bytes = new Uint8Array(await productData.photo.arrayBuffer());
        photoBlob = ExternalBlob.fromBytes(bytes);
      }

      await addMutation.mutateAsync({
        barcode: productData.barcode,
        name: productData.name,
        categoryId: BigInt(productData.categoryId),
        description: productData.description || undefined,
        inStock: productData.inStock,
        photo: photoBlob,
        isFeatured: productData.isFeatured,
      });
      toast.success('Producto creado exitosamente');
      setIsAddModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el producto');
    }
  };

  // Handle edit product
  const handleEditProduct = async (productData: {
    barcode: string;
    name: string;
    categoryId: string;
    description: string;
    inStock: boolean;
    photo: File | null;
    isFeatured: boolean;
  }) => {
    try {
      let photoBlob: ExternalBlob | undefined = undefined;
      if (productData.photo) {
        const bytes = new Uint8Array(await productData.photo.arrayBuffer());
        photoBlob = ExternalBlob.fromBytes(bytes);
      }

      await updateMutation.mutateAsync({
        barcode: productData.barcode,
        name: productData.name,
        categoryId: BigInt(productData.categoryId),
        description: productData.description || undefined,
        inStock: productData.inStock,
        photo: photoBlob,
        isFeatured: productData.isFeatured,
      });
      toast.success('Producto actualizado exitosamente');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el producto');
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (password: string) => {
    if (!selectedProduct) return;
    try {
      await deleteMutation.mutateAsync(selectedProduct.barcode);
      toast.success('Producto eliminado exitosamente');
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el producto');
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(0);
  };

  // Generate page numbers (only for desktop)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        for (let i = 0; i < 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        pages.push(0);
        pages.push('...');
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(0);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h2>
            <p className="text-gray-600 dark:text-gray-400">Gestiona el catálogo de productos de tu tienda</p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por código de barras, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={categoryFilter} onValueChange={(value) => {
            setCategoryFilter(value);
            setCurrentPage(0);
          }}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent className="scrollable-category-dropdown">
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md">
            <Checkbox
              id="featuredOnly"
              checked={featuredOnly}
              onCheckedChange={(checked) => {
                setFeaturedOnly(checked as boolean);
                setCurrentPage(0);
              }}
            />
            <label
              htmlFor="featuredOnly"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Solo productos destacados
            </label>
          </div>
        </div>
      </div>

      {/* Desktop Table / Mobile Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {searchTerm || categoryFilter !== 'all' || featuredOnly ? 'No se encontraron productos' : 'No hay productos'}
            </p>
            <p className="text-sm mt-2">
              {searchTerm || categoryFilter !== 'all' || featuredOnly
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza agregando tu primer producto'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Código de barras</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-40">Categoría</TableHead>
                    <TableHead className="w-32 text-center">En Stock</TableHead>
                    <TableHead className="w-32 text-center">Destacado</TableHead>
                    <TableHead className="w-32 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.barcode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[120px]">{product.barcode}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => copyToClipboard(product.barcode, 'Código de barras')}
                            title="Copiar código de barras"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => copyToClipboard(product.name, 'Nombre')}
                            title="Copiar nombre"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getCategoryName(product.categoryId)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={product.inStock}
                            onCheckedChange={() => handleToggleStock(product.barcode, product.inStock)}
                            disabled={toggleStockMutation.isPending}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-2">
                          <Switch
                            checked={product.isFeatured}
                            onCheckedChange={() => handleToggleFeatured(product.barcode, product.isFeatured)}
                            disabled={togglingFeatured === product.barcode}
                            title={product.isFeatured ? 'Quitar de destacados' : 'Hacer destacado'}
                          />
                          {product.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(product)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => openDeleteDialog(product)}
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
              {products.map((product) => (
                <div key={product.barcode} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white inline-block">
                          {product.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(product.name, 'Nombre')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                          {product.barcode}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(product.barcode, 'Código')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Categoría:</span> {getCategoryName(product.categoryId)}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={product.inStock}
                        onCheckedChange={() => handleToggleStock(product.barcode, product.inStock)}
                        disabled={toggleStockMutation.isPending}
                        id={`stock-${product.barcode}`}
                      />
                      <label htmlFor={`stock-${product.barcode}`} className="text-sm font-medium">
                        En Stock
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isFeatured}
                        onCheckedChange={() => handleToggleFeatured(product.barcode, product.isFeatured)}
                        disabled={togglingFeatured === product.barcode}
                        id={`featured-${product.barcode}`}
                      />
                      <label htmlFor={`featured-${product.barcode}`} className="text-sm font-medium flex items-center gap-1">
                        {product.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        Destacado
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(product)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => openDeleteDialog(product)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Mostrando</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>de {totalCount} productos</span>
              </div>

              {/* Mobile Pagination: Only Anterior/Siguiente */}
              {isMobile ? (
                <div className="flex items-center gap-2 justify-center w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="flex-1 max-w-[140px]"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="flex-1 max-w-[140px]"
                  >
                    Siguiente
                  </Button>
                </div>
              ) : (
                /* Desktop Pagination: Full with page numbers */
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Anterior
                  </Button>

                  {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page + 1}
                      </Button>
                    ) : (
                      <span key={index} className="px-2 text-gray-400">
                        {page}
                      </span>
                    )
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddProduct}
        title="Agregar Producto"
        categories={categories}
        isLoading={addMutation.isPending}
      />

      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleEditProduct}
        title="Editar Producto"
        categories={categories}
        initialProduct={selectedProduct}
        isLoading={updateMutation.isPending}
      />

      <DeleteProductDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        productName={selectedProduct?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
