import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { parseJSONWithBigInt } from '../../utils/BigIntSerializer';
import { safeConvertToNumber, convertStockToBoolean } from '../../utils/NumericConverter';
import { useImportProducts, useBulkImportCategories } from '../../hooks/useQueries';
import { useToast } from '../../hooks/useToast';
import type { Product, Category } from '../../backend';

interface ProductImportData {
  barcode: string;
  name: string;
  categoryId: number | string | bigint;
  description?: string;
  stock?: number | string | boolean;
  isFeatured?: boolean;
}

interface CategoryImportData {
  id: number | string | bigint;
  name: string;
  order?: number | string | bigint;
}

interface ImportFileData {
  products?: ProductImportData[];
  categories?: CategoryImportData[];
  totalCount?: number;
}

interface ValidationError {
  line: number;
  field: string;
  message: string;
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');
  const [isDragging, setIsDragging] = useState(false);
  const [productsPreview, setProductsPreview] = useState<Product[]>([]);
  const [categoriesPreview, setCategoriesPreview] = useState<Category[]>([]);
  const [allValidProducts, setAllValidProducts] = useState<Product[]>([]);
  const [allValidCategories, setAllValidCategories] = useState<Category[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const importProducts = useImportProducts();
  const importCategories = useBulkImportCategories();
  const { success, error, warning, info } = useToast();

  // Automatic import trigger when valid data is available
  useEffect(() => {
    if (activeTab === 'products' && allValidProducts.length > 0 && !isImporting && !importSummary) {
      handleImportProducts();
    }
  }, [allValidProducts, activeTab]);

  useEffect(() => {
    if (activeTab === 'categories' && allValidCategories.length > 0 && !isImporting && !importSummary) {
      handleImportCategories();
    }
  }, [allValidCategories, activeTab]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));

    if (jsonFile) {
      processFile(jsonFile);
    } else {
      error('Por favor, selecciona un archivo JSON válido');
    }
  }, [activeTab]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  }, [activeTab]);

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseJSONWithBigInt<ImportFileData>(text);

      if (activeTab === 'products') {
        processProductsFile(data);
      } else {
        processCategoriesFile(data);
      }
    } catch (err: any) {
      error(`Error al leer el archivo: ${err.message || 'Formato JSON inválido'}`);
      setValidationErrors([]);
      setProductsPreview([]);
      setCategoriesPreview([]);
      setAllValidProducts([]);
      setAllValidCategories([]);
    }
  };

  const processProductsFile = (data: ImportFileData) => {
    setImportSummary(null);
    const errors: ValidationError[] = [];
    const validProducts: Product[] = [];

    if (!data.products || !Array.isArray(data.products)) {
      error('El archivo debe contener un array "products"');
      setValidationErrors([]);
      setProductsPreview([]);
      setAllValidProducts([]);
      return;
    }

    if (data.totalCount === undefined) {
      warning('El archivo no contiene el campo "totalCount"');
    }

    const barcodes = new Set<string>();

    data.products.forEach((item, index) => {
      const line = index + 1;

      // Validate required fields
      if (!item.barcode || typeof item.barcode !== 'string') {
        errors.push({ line, field: 'barcode', message: 'Campo requerido o tipo inválido' });
        return;
      }

      if (!item.name || typeof item.name !== 'string') {
        errors.push({ line, field: 'name', message: 'Campo requerido o tipo inválido' });
        return;
      }

      if (item.categoryId === undefined || item.categoryId === null) {
        errors.push({ line, field: 'categoryId', message: 'Campo requerido' });
        return;
      }

      // Check for duplicates
      if (barcodes.has(item.barcode)) {
        errors.push({ line, field: 'barcode', message: 'Código de barras duplicado en el archivo' });
        return;
      }
      barcodes.add(item.barcode);

      try {
        // Handle BigInt directly or convert string/number to number
        let categoryId: number;
        if (typeof item.categoryId === 'bigint') {
          categoryId = Number(item.categoryId);
          if (!isFinite(categoryId)) {
            errors.push({ line, field: 'categoryId', message: 'BigInt demasiado grande para convertir a número' });
            return;
          }
        } else {
          const converted = safeConvertToNumber(item.categoryId, 'categoryId');
          if (converted === null || converted < 0) {
            errors.push({ line, field: 'categoryId', message: 'Debe ser un número positivo válido' });
            return;
          }
          categoryId = converted;
        }

        // Convert stock to boolean
        const inStock = convertStockToBoolean(item.stock);

        // Handle isFeatured field (optional, defaults to false)
        const isFeatured = typeof item.isFeatured === 'boolean' ? item.isFeatured : false;

        // Create valid product with properly converted values
        const product: Product = {
          barcode: item.barcode.trim(),
          name: item.name.trim(),
          categoryId: BigInt(Math.floor(categoryId)),
          description: item.description?.trim() || undefined,
          inStock,
          isFeatured,
          photo: undefined,
          createdDate: undefined,
          lastUpdatedDate: undefined,
        };

        validProducts.push(product);
      } catch (err: any) {
        errors.push({ 
          line, 
          field: 'conversion', 
          message: `Error de conversión: ${err.message || 'valor inválido'}` 
        });
      }
    });

    setValidationErrors(errors);
    setAllValidProducts(validProducts);
    setProductsPreview(validProducts.slice(0, 10));

    if (validProducts.length > 0) {
      info(`${validProducts.length} productos válidos encontrados. Iniciando importación...`);
    }

    if (errors.length > 0) {
      warning(`${errors.length} errores de validación encontrados`);
    }
  };

  const processCategoriesFile = (data: ImportFileData) => {
    setImportSummary(null);
    const errors: ValidationError[] = [];
    const validCategories: Category[] = [];

    if (!data.categories || !Array.isArray(data.categories)) {
      error('El archivo debe contener un array "categories"');
      setValidationErrors([]);
      setCategoriesPreview([]);
      setAllValidCategories([]);
      return;
    }

    const ids = new Set<number>();

    data.categories.forEach((item, index) => {
      const line = index + 1;

      // Validate required fields
      if (item.id === undefined || item.id === null) {
        errors.push({ line, field: 'id', message: 'Campo requerido' });
        return;
      }

      if (!item.name || typeof item.name !== 'string') {
        errors.push({ line, field: 'name', message: 'Campo requerido o tipo inválido' });
        return;
      }

      try {
        // Handle BigInt directly or convert string/number to number for id
        let id: number;
        if (typeof item.id === 'bigint') {
          id = Number(item.id);
          if (!isFinite(id)) {
            errors.push({ line, field: 'id', message: 'BigInt demasiado grande para convertir a número' });
            return;
          }
        } else {
          const converted = safeConvertToNumber(item.id, 'id');
          if (converted === null || converted < 0) {
            errors.push({ line, field: 'id', message: 'Debe ser un número positivo válido' });
            return;
          }
          id = converted;
        }

        const idInt = Math.floor(id);

        // Check for duplicates
        if (ids.has(idInt)) {
          errors.push({ line, field: 'id', message: 'ID duplicado en el archivo' });
          return;
        }
        ids.add(idInt);

        // Handle BigInt directly or convert string/number to number for order
        let order = 0;
        if (item.order !== undefined && item.order !== null) {
          if (typeof item.order === 'bigint') {
            order = Number(item.order);
            if (!isFinite(order)) {
              errors.push({ line, field: 'order', message: 'BigInt demasiado grande para convertir a número' });
              return;
            }
          } else {
            const orderConverted = safeConvertToNumber(item.order, 'order');
            if (orderConverted === null || orderConverted < 0) {
              errors.push({ line, field: 'order', message: 'Debe ser un número positivo válido' });
              return;
            }
            order = orderConverted;
          }
        }

        // Create valid category with properly converted values
        const category: Category = {
          id: BigInt(idInt),
          name: item.name.trim(),
          order: BigInt(Math.floor(order)),
          createdDate: BigInt(Date.now() * 1000000),
          lastUpdatedDate: BigInt(Date.now() * 1000000),
        };

        validCategories.push(category);
      } catch (err: any) {
        errors.push({ 
          line, 
          field: 'conversion', 
          message: `Error de conversión: ${err.message || 'valor inválido'}` 
        });
      }
    });

    setValidationErrors(errors);
    setAllValidCategories(validCategories);
    setCategoriesPreview(validCategories.slice(0, 10));

    if (validCategories.length > 0) {
      info(`${validCategories.length} categorías válidas encontradas. Iniciando importación...`);
    }

    if (errors.length > 0) {
      warning(`${errors.length} errores de validación encontrados`);
    }
  };

  const handleImportProducts = async () => {
    if (allValidProducts.length === 0 || isImporting) {
      return;
    }

    setIsImporting(true);
    try {
      await importProducts.mutateAsync(allValidProducts);
      success(`${allValidProducts.length} productos importados exitosamente`);
      setImportSummary({
        imported: allValidProducts.length,
        skipped: 0,
        errors: [],
      });
      setProductsPreview([]);
      setAllValidProducts([]);
      setValidationErrors([]);
    } catch (err: any) {
      error(`Error al importar productos: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCategories = async () => {
    if (allValidCategories.length === 0 || isImporting) {
      return;
    }

    setIsImporting(true);
    try {
      const result = await importCategories.mutateAsync(allValidCategories);
      success(`${Number(result.imported)} categorías importadas exitosamente`);
      setImportSummary({
        imported: Number(result.imported),
        skipped: Number(result.skipped),
        errors: result.errors,
      });
      setCategoriesPreview([]);
      setAllValidCategories([]);
      setValidationErrors([]);
    } catch (err: any) {
      error(`Error al importar categorías: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const clearPreview = () => {
    setProductsPreview([]);
    setCategoriesPreview([]);
    setAllValidProducts([]);
    setAllValidCategories([]);
    setValidationErrors([]);
    setImportSummary(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Importar Datos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Importa productos y categorías desde archivos JSON
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'categories' | 'products')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Importar Categorías
            </h3>

            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileJson className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Arrastra un archivo JSON aquí
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="categories-file-input"
              />
              <Button asChild variant="outline">
                <label htmlFor="categories-file-input" className="cursor-pointer">
                  Seleccionar Archivo
                </label>
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Campos utilizados: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">id</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">name</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">order</code></li>
                    <li>Otros campos serán ignorados</li>
                    <li>Los números en formato string (ej: "1", "5") y BigInt serán convertidos automáticamente</li>
                    <li>Los IDs de categoría se preservarán del archivo</li>
                    <li>El backend actualizará automáticamente la secuencia de IDs</li>
                    <li><strong>La importación se iniciará automáticamente tras validación exitosa</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h4 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Errores de Validación ({validationErrors.length})
                </h4>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {validationErrors.slice(0, 20).map((err, idx) => (
                  <div key={idx} className="text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                    <span className="font-medium">Línea {err.line}</span> - {err.field}: {err.message}
                  </div>
                ))}
                {validationErrors.length > 20 && (
                  <p className="text-sm text-red-600 dark:text-red-400 italic">
                    ... y {validationErrors.length - 20} errores más
                  </p>
                )}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                <div>
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Importando Categorías...
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Por favor espera mientras se procesan {allValidCategories.length} categorías
                  </p>
                </div>
              </div>
            </div>
          )}

          {allValidCategories.length > 0 && !isImporting && !importSummary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vista Previa (primeras 10 de {allValidCategories.length})
                </h4>
                <Button variant="outline" onClick={clearPreview}>
                  Cancelar
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">ID</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Nombre</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Orden</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoriesPreview.map((category, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{category.id.toString()}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{category.name}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{category.order.toString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importSummary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Importación Completada
                </h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Importadas:</span> {importSummary.imported}</p>
                <p><span className="font-medium">Omitidas:</span> {importSummary.skipped}</p>
                {importSummary.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Errores:</p>
                    <ul className="list-disc list-inside ml-4">
                      {importSummary.errors.map((err, idx) => (
                        <li key={idx} className="text-red-600 dark:text-red-400">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Las categorías han sido importadas. Puedes verlas en la página de Categorías.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Importar Productos
            </h3>

            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileJson className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Arrastra un archivo JSON aquí
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="products-file-input"
              />
              <Button asChild variant="outline">
                <label htmlFor="products-file-input" className="cursor-pointer">
                  Seleccionar Archivo
                </label>
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Campos utilizados: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">barcode</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">name</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">categoryId</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">description</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">stock</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">isFeatured</code></li>
                    <li>Otros campos serán ignorados</li>
                    <li>Los números en formato string (ej: "12") y BigInt serán convertidos automáticamente</li>
                    <li>El campo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">stock</code> será convertido a booleano <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">inStock</code> (0 = false, otros = true)</li>
                    <li>El campo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">isFeatured</code> es opcional (por defecto: false)</li>
                    <li><strong>La importación se iniciará automáticamente tras validación exitosa</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h4 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Errores de Validación ({validationErrors.length})
                </h4>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {validationErrors.slice(0, 20).map((err, idx) => (
                  <div key={idx} className="text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                    <span className="font-medium">Línea {err.line}</span> - {err.field}: {err.message}
                  </div>
                ))}
                {validationErrors.length > 20 && (
                  <p className="text-sm text-red-600 dark:text-red-400 italic">
                    ... y {validationErrors.length - 20} errores más
                  </p>
                )}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                <div>
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Importando Productos...
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Por favor espera mientras se procesan {allValidProducts.length} productos
                  </p>
                </div>
              </div>
            </div>
          )}

          {allValidProducts.length > 0 && !isImporting && !importSummary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vista Previa (primeros 10 de {allValidProducts.length})
                </h4>
                <Button variant="outline" onClick={clearPreview}>
                  Cancelar
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Código</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Nombre</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Categoría ID</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">En Stock</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Destacado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productsPreview.map((product, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{product.barcode}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{product.name}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{product.categoryId.toString()}</td>
                        <td className="px-4 py-2">
                          {product.inStock ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {product.isFeatured ? (
                            <CheckCircle2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importSummary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Importación Completada
                </h4>
              </div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Importados:</span> {importSummary.imported}</p>
                <p><span className="font-medium">Omitidos:</span> {importSummary.skipped}</p>
                {importSummary.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Errores:</p>
                    <ul className="list-disc list-inside ml-4">
                      {importSummary.errors.map((err, idx) => (
                        <li key={idx} className="text-red-600 dark:text-red-400">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Los productos han sido importados. Puedes verlos en la página de Productos.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
