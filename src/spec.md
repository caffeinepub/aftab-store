# Specification

## Summary
**Goal:** Refactor product details modal flows so `ProductDetailModal` performs zero internal data fetching and instead receives all required product, store, and category data via props, while preserving existing UI behavior.

**Planned changes:**
- Update `ProductDetailModal` to remove all internal React Query/API calls and require `product`, `storeDetails`, `categoryDetails { id, name }`, and `onClose` via props (no category lookup/mapping inside the modal).
- Update product detail view/modal rendering to display category name from `categoryDetails.name` and navigate to category using encoded query-parameter format `/category?id=<id>` via TanStack Router.
- Update Home page modal-opening flow to load `storeDetails` once on initial Home load and pass it to the modal; pass `categoryDetails` derived from existing Home category data when selecting products from category sections.
- Update Search flows (autocomplete + full results) to open the modal using already-available `storeDetails` from the parent and `categoryDetails` derived from selected product data; remove `useGetStoreDetails()` usage from `SearchBar`.
- Update Category page modal-opening flow to load `storeDetails` once on Category page load and pass it along with current-page `categoryDetails` into the modal.
- Enforce modal-only internal navigation: product interactions on Home, Search, and Category pages open `ProductDetailModal` instead of navigating to `/product/$barcode` (standalone product page remains accessible via direct URL).
- Preserve existing layout/styling constraints (Home search box remains full width in 1200px container; no modifications to the existing `:root` CSS variables block in `frontend/src/index.css`).

**User-visible outcome:** Opening product details from Home, Search, or Category pages consistently opens a modal without triggering extra network requests from within the modal, while category display/linking and existing product-detail actions continue to work as before.
