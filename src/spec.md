# Specification

## Summary
**Goal:** Refactor `ProductDetailModal` to be fully data-driven (no internal fetching) by passing product, store, and category context via props, while preserving all existing modal behaviors and enabling category navigation via `/category/{id}`.

**Planned changes:**
- Update `frontend/src/components/ProductDetailModal.tsx` to remove all internal React Query/API hooks (`useGetAllCategories`, `useGetStoreDetails`) and require props: `product`, `storeDetails`, `categoryDetails { id, name }`, and `onClose`, with no in-modal category lookup/mapping.
- Update `HomePage` modal flow to load `storeDetails` once on the page, derive `categoryDetails` from already-loaded homepage category context, and pass `product + storeDetails + categoryDetails` into `ProductDetailModal`.
- Update homepage category browsing components so product selection callbacks include `{ categoryDetails: { id, name } }` derived from existing category-with-products data, enforced via TypeScript types, without adding new fetches.
- Refactor `SearchBar` to stop fetching store details; instead accept `storeDetails` via props from `HomePage` and open `ProductDetailModal` for both autocomplete and full-results clicks while closing the autocomplete dropdown on selection; derive `categoryDetails` from search result data when available and gracefully omit category display/link when missing (no fetching).
- Update `CategoryPage` to load `storeDetails` once on the page and pass it plus current page `categoryDetails` into `ProductDetailModal` when opening from category product cards.
- Update modal category UI to use `categoryDetails` for display/navigation and link to `/category/${categoryDetails.id}`.
- Add router support for category navigation via `/category/$categoryId` while keeping `/product/$barcode` unchanged, and preserve/redirect any prior category navigation format without user-visible errors.

**User-visible outcome:** Opening a product detail modal from home categories, search, or category pages is instant and does not trigger any modal-owned network requests; the modal still behaves the same (close interactions, focus/scroll/back handling) and its category link navigates correctly to `/category/{id}`.
