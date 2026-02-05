# Specification

## Summary
**Goal:** Make product search return/display at most 10 items and refactor `ProductDetailModal` to be fully prop-driven (no internal fetching), while keeping the standalone product page unchanged.

**Planned changes:**
- Backend: Update `searchProducts(criteria : ProductSearchCriteria)` to return a maximum of 10 products in `results.products`, while keeping `results.totalCount` as the full match count and preserving existing featured-first + recency sorting.
- Frontend: Refactor `ProductDetailModal` to accept a required full `product` prop and render without any internal React Query/network requests; add a graceful error state for missing/invalid product fields while preserving close/focus/scroll behaviors.
- Frontend: Update all modal-opening flows (home category sections, search autocomplete selection, search results grid/Enter flow, category page product cards) to pass the full product object into the modal.
- Frontend: Update `ProductCard` (and impacted callers) so selection callbacks can pass the full product object, while preserving existing navigation behavior when no callback is provided.
- Frontend: Keep `/product/$barcode` standalone product detail page behavior unchanged (continues to fetch via existing hooks).
- Frontend: Update `SearchBar` full-results UI to align with the 10-result backend cap: show displayed count (≤ 10), render results in a responsive grid (5 columns desktop / 2 columns mobile), and when `totalCount > 10` show: "Mostrando los 10 primeros resultados. Refina tu búsqueda para más."
- Frontend: Ensure modal Share/WhatsApp actions work using only passed-in/cached data (share URL from `product.barcode`; WhatsApp uses `formatWhatsAppApiNumber()` without modal-initiated store fetches).

**User-visible outcome:** Searching shows up to 10 results with clear messaging when more matches exist, and opening product details from home/search/category lists is faster and does not trigger extra fetching inside the modal; direct product URLs continue to work as before.
