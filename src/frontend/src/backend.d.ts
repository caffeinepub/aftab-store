import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    name: string;
}
export interface Category {
    id: bigint;
    order: bigint;
    name: string;
    createdDate: Time;
    lastUpdatedDate: Time;
}
export type Time = bigint;
export interface StoreHours {
    tuesday: string;
    wednesday: string;
    saturday: string;
    thursday: string;
    sunday: string;
    friday: string;
    monday: string;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface PaginatedCategories {
    categories: Array<Category>;
    hasMore: boolean;
    totalCount: bigint;
}
export interface StoreDetails {
    name: string;
    banner?: ExternalBlob;
    createdDate?: Time;
    whatsapp: string;
    storeHours: StoreHours;
    email: string;
    address: string;
    lastUpdatedDate?: Time;
    phone: string;
    coordinates: Coordinates;
}
export interface ProductSearchCriteria {
    categoryId?: bigint;
    featuredOnly?: boolean;
    featuredFirst?: boolean;
    searchValue?: string;
    searchBy?: string;
}
export interface CategoryWithProducts {
    productCount: bigint;
    category: Category;
    products: Array<Product>;
}
export interface UserRoleInfo {
    principal: string;
    role: string;
}
export interface PaginatedProducts {
    totalCount: bigint;
    pageSize: bigint;
    currentPage: bigint;
    totalPages: bigint;
    products: Array<Product>;
}
export interface ProductSearchResults {
    totalCount: bigint;
    totalPages: bigint;
    products: Array<Product>;
}
export interface Product {
    categoryId: bigint;
    inStock: boolean;
    name: string;
    createdDate?: Time;
    description?: string;
    isFeatured: boolean;
    barcode: string;
    lastUpdatedDate?: Time;
    photo?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCategory(name: string, order: bigint): Promise<void>;
    addProduct(barcode: string, name: string, categoryId: bigint, description: string | null, inStock: boolean, photo: ExternalBlob | null, isFeatured: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserRole(principalText: string, roleText: string): Promise<void>;
    bulkImportCategories(categoriesToImport: Array<Category>): Promise<{
        imported: bigint;
        skipped: bigint;
        errors: Array<string>;
    }>;
    createStoreDetails(name: string, banner: ExternalBlob | null, address: string, phone: string, whatsapp: string, email: string, storeHours: StoreHours, coordinates: Coordinates): Promise<void>;
    deleteCategory(id: bigint): Promise<void>;
    deleteProduct(barcode: string): Promise<void>;
    getAllCategories(): Promise<Array<Category>>;
    getAllUserRoles(): Promise<Array<UserRoleInfo>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategoriesPaginated(offset: bigint, limit: bigint): Promise<PaginatedCategories>;
    getCategoriesWithProducts(offset: bigint, limit: bigint): Promise<Array<CategoryWithProducts>>;
    getCategoryById(categoryId: bigint): Promise<Category | null>;
    getCategoryProductsPaginated(categoryId: bigint, offset: bigint, limit: bigint, featuredOnly: boolean | null): Promise<{
        totalCount: bigint;
        products: Array<Product>;
    }>;
    getFeaturedProducts(offset: bigint, limit: bigint): Promise<{
        totalCount: bigint;
        products: Array<Product>;
    }>;
    getProduct(barcode: string): Promise<Product | null>;
    getProducts(page: bigint, pageSize: bigint, search: string, categoryId: bigint | null, featuredOnly: boolean | null, featuredFirst: boolean | null): Promise<PaginatedProducts>;
    getProductsByCategory(categoryId: bigint, featuredOnly: boolean | null): Promise<Array<Product>>;
    getStoreDetails(): Promise<StoreDetails>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importProducts(importedProducts: Array<Product>): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    removeAdminRole(principalText: string): Promise<void>;
    reorderCategory(id: bigint, newOrder: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchProducts(criteria: ProductSearchCriteria): Promise<ProductSearchResults>;
    toggleCategoryActivation(id: bigint): Promise<void>;
    toggleStock(barcode: string): Promise<void>;
    updateCategory(id: bigint, name: string, order: bigint): Promise<void>;
    updateCategoryId(oldCategoryId: bigint, newCategoryId: bigint): Promise<void>;
    updateProduct(barcode: string, name: string, categoryId: bigint, description: string | null, inStock: boolean, photo: ExternalBlob | null, isFeatured: boolean): Promise<void>;
    updateProductFeaturedStatus(barcode: string, isFeatured: boolean): Promise<void>;
    updateStoreDetails(name: string, banner: ExternalBlob | null, address: string, phone: string, whatsapp: string, email: string, storeHours: StoreHours, coordinates: Coordinates): Promise<void>;
}
