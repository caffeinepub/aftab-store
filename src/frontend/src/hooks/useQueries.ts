import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { ExternalBlob, StoreHours, Coordinates } from '../backend';
import type {
  Category,
  Product,
  PaginatedProducts,
  StoreDetails,
  UserProfile,
  ProductSearchCriteria,
  ProductSearchResults,
  PaginatedCategories,
  CategoryWithProducts,
  UserRoleInfo,
} from '../backend';

// USER PROFILE QUERIES

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const [stableActor, setStableActor] = useState(actor);

  useEffect(() => {
    if (actor && !actorFetching) {
      setStableActor(actor);
    }
  }, [actor, actorFetching]);

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!stableActor) throw new Error('Actor not available');
      return stableActor.getCallerUserProfile();
    },
    enabled: !!stableActor,
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!stableActor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ADMIN STATUS QUERY

export function useAdminStatus() {
  const { actor } = useActor();

  return useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor,
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// USER ROLE MANAGEMENT QUERIES

export function useGetAllUserRoles() {
  const { actor, isFetching: actorFetching } = useActor();
  const [stableActor, setStableActor] = useState(actor);

  useEffect(() => {
    if (actor && !actorFetching) {
      setStableActor(actor);
    }
  }, [actor, actorFetching]);

  return useQuery<UserRoleInfo[]>({
    queryKey: ['userRoles'],
    queryFn: async () => {
      if (!stableActor) return [];
      return stableActor.getAllUserRoles();
    },
    enabled: !!stableActor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      principalText,
      roleText,
    }: {
      principalText: string;
      roleText: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignUserRole(principalText, roleText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
    },
  });
}

export function useRemoveAdminRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalText: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeAdminRole(principalText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
    },
  });
}

// CATEGORY QUERIES

// Shared component hook with longer cache time
export function useGetAllCategories() {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');
      return stableActor.getAllCategories();
    },
    enabled: Boolean(stableActor) && !actorFetching,
    staleTime: 1000 * 60 * 30, // 30 minutes - shared component, infrequent changes
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useGetCategoriesPaginated(offset: number, limit: number) {
  const { actor, isFetching: actorFetching } = useActor();
  const [stableActor, setStableActor] = useState(actor);

  useEffect(() => {
    if (actor && !actorFetching) {
      setStableActor(actor);
    }
  }, [actor, actorFetching]);

  return useQuery<PaginatedCategories>({
    queryKey: ['categories', 'paginated', offset, limit],
    queryFn: async () => {
      if (!stableActor) throw new Error('Actor not available');
      return stableActor.getCategoriesPaginated(BigInt(offset), BigInt(limit));
    },
    enabled: !!stableActor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Public page hook with standard cache configuration
export function useGetCategoriesWithProducts(offset: number, limit: number) {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<CategoryWithProducts[]>({
    queryKey: ['categoriesWithProducts', offset, limit],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');
      return stableActor.getCategoriesWithProducts(BigInt(offset), BigInt(limit));
    },
    enabled: Boolean(stableActor) && !actorFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

// Public page hook with standard cache configuration
export function useGetCategoryById(categoryId: string) {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<Category | null>({
    queryKey: ['category', categoryId],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');
      return stableActor.getCategoryById(BigInt(categoryId));
    },
    enabled: Boolean(stableActor) && !actorFetching && !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useAddCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, order }: { name: string; order: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCategory(name, order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
    },
  });
}

export function useUpdateCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, order }: { id: bigint; name: string; order: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCategory(id, name, order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
    },
  });
}

export function useReorderCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newOrder }: { id: bigint; newOrder: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reorderCategory(id, newOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
    },
  });
}

export function useBulkImportCategories() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: Category[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkImportCategories(categories);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
    },
  });
}

// PRODUCT QUERIES

export function useGetProducts(
  page: number,
  pageSize: number,
  search: string,
  categoryId: bigint | null,
  featuredOnly: boolean = false
) {
  const { actor, isFetching: actorFetching } = useActor();
  const [stableActor, setStableActor] = useState(actor);

  useEffect(() => {
    if (actor && !actorFetching) {
      setStableActor(actor);
    }
  }, [actor, actorFetching]);

  const filters = { search, categoryId: categoryId?.toString() || null, featuredOnly };

  return useQuery<PaginatedProducts>({
    queryKey: ['products', page, pageSize, filters],
    queryFn: async () => {
      if (!stableActor) throw new Error('Actor not available');
      return stableActor.getProducts(
        BigInt(page),
        BigInt(pageSize),
        search,
        categoryId,
        featuredOnly,
        null
      );
    },
    enabled: !!stableActor,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Public page hook with standard cache configuration
export function useGetProduct(barcode: string) {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<Product | null>({
    queryKey: ['product', barcode],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');
      return stableActor.getProduct(barcode);
    },
    enabled: Boolean(stableActor) && !actorFetching && !!barcode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useGetProductsByCategory(categoryId: number) {
  const { actor, isFetching: actorFetching } = useActor();
  const [stableActor, setStableActor] = useState(actor);

  useEffect(() => {
    if (actor && !actorFetching) {
      setStableActor(actor);
    }
  }, [actor, actorFetching]);

  return useQuery<Product[]>({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      if (!stableActor) return [];
      return stableActor.getProductsByCategory(BigInt(categoryId), null);
    },
    enabled: !!stableActor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Public page hook with standard cache configuration
export function useGetCategoryProductsPaginated(
  categoryId: string,
  offset: number,
  limit: number
) {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<{ products: Product[]; totalCount: bigint }>({
    queryKey: ['categoryProducts', categoryId, offset, limit],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');
      return stableActor.getCategoryProductsPaginated(
        BigInt(categoryId),
        BigInt(offset),
        BigInt(limit),
        null
      );
    },
    enabled: Boolean(stableActor) && !actorFetching && !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useGetFeaturedProducts(offset: number, limit: number) {
  const { actor, isFetching: actorFetching } = useActor();
  const [stableActor, setStableActor] = useState(actor);

  useEffect(() => {
    if (actor && !actorFetching) {
      setStableActor(actor);
    }
  }, [actor, actorFetching]);

  return useQuery<{ products: Product[]; totalCount: bigint }>({
    queryKey: ['featuredProducts', offset, limit],
    queryFn: async () => {
      if (!stableActor) throw new Error('Actor not available');
      return stableActor.getFeaturedProducts(BigInt(offset), BigInt(limit));
    },
    enabled: !!stableActor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      barcode: string;
      name: string;
      categoryId: bigint;
      description?: string;
      inStock: boolean;
      photo?: ExternalBlob;
      isFeatured?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProduct(
        product.barcode,
        product.name,
        product.categoryId,
        product.description || null,
        product.inStock,
        product.photo || null,
        product.isFeatured || false
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      barcode: string;
      name: string;
      categoryId: bigint;
      description?: string;
      inStock: boolean;
      photo?: ExternalBlob;
      isFeatured?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(
        product.barcode,
        product.name,
        product.categoryId,
        product.description || null,
        product.inStock,
        product.photo || null,
        product.isFeatured || false
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barcode: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(barcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}

export function useToggleStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barcode: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleStock(barcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
    },
  });
}

export function useUpdateProductFeaturedStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ barcode, isFeatured }: { barcode: string; isFeatured: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProductFeaturedStatus(barcode, isFeatured);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}

export function useImportProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: Product[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importProducts(products);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
    },
  });
}

// SEARCH QUERIES

// Public page hook with standard cache configuration
export function useSearchProducts(searchValue: string) {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<ProductSearchResults>({
    queryKey: ['search', searchValue],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');

      const criteria: ProductSearchCriteria = {
        searchBy: 'name',
        searchValue: searchValue,
        categoryId: undefined,
        featuredOnly: undefined,
        featuredFirst: true,
      };

      return stableActor.searchProducts(criteria);
    },
    enabled: Boolean(stableActor) && !actorFetching && searchValue.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

// STORE DETAILS QUERIES

// Shared component hook with longer cache time
export function useGetStoreDetails() {
  const actorState = useActor();
  const rawActor = actorState.actor;
  const actorFetching = actorState.isFetching;

  const [stableActor, setStableActor] = useState<typeof rawActor>(null);

  // Stabilize actor reference
  useEffect(() => {
    if (rawActor && !stableActor) {
      setStableActor(rawActor);
    }
  }, [rawActor, stableActor]);

  return useQuery<StoreDetails>({
    queryKey: ['storeDetails'],
    queryFn: async ({ signal }) => {
      if (!stableActor) throw new Error('Actor not available');
      if (signal?.aborted) throw new Error('Query aborted');
      return stableActor.getStoreDetails();
    },
    enabled: Boolean(stableActor) && !actorFetching,
    staleTime: 1000 * 60 * 30, // 30 minutes - shared component, infrequent changes
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useCreateStoreDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: {
      name: string;
      banner?: ExternalBlob;
      address: string;
      phone: string;
      whatsapp: string;
      email: string;
      storeHours: StoreHours;
      coordinates: Coordinates;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStoreDetails(
        details.name,
        details.banner || null,
        details.address,
        details.phone,
        details.whatsapp,
        details.email,
        details.storeHours,
        details.coordinates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeDetails'] });
    },
  });
}

export function useUpdateStoreDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: {
      name: string;
      banner?: ExternalBlob;
      address: string;
      phone: string;
      whatsapp: string;
      email: string;
      storeHours: StoreHours;
      coordinates: Coordinates;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStoreDetails(
        details.name,
        details.banner || null,
        details.address,
        details.phone,
        details.whatsapp,
        details.email,
        details.storeHours,
        details.coordinates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeDetails'] });
    },
  });
}

// UTILITY QUERIES

export function useUpdateCategoryId() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      oldCategoryId,
      newCategoryId,
    }: {
      oldCategoryId: bigint;
      newCategoryId: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCategoryId(oldCategoryId, newCategoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoriesWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['categoryProducts'] });
    },
  });
}
