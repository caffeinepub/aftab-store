// Shared types for product detail modal and selection flows

export interface CategoryDetails {
  id: string;
  name?: string;
}

export interface ProductSelection {
  product: import('../backend').Product;
  categoryDetails: CategoryDetails;
}
