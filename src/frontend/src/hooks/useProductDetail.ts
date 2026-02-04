import { useGetProduct, useGetAllCategories, useGetStoreDetails } from './useQueries';

export function useProductDetail(barcode: string) {
  const { data: product, isLoading: productLoading, isError: productError } = useGetProduct(barcode);
  const { data: categories = [] } = useGetAllCategories();
  const { data: storeDetails } = useGetStoreDetails();

  const categoryName = categories.find(
    (cat) => product && cat.id === product.categoryId
  )?.name;

  const isStoreDetailsLoading = !storeDetails;

  return {
    product,
    productLoading,
    productError,
    categories,
    categoryName,
    storeDetails,
    isStoreDetailsLoading,
  };
}
