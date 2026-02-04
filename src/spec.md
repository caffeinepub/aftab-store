# Specification

## Summary
**Goal:** Restore the backend `getCategoriesWithProducts(offset, limit)` behavior for category pagination and per-category product slicing to match the prior correct implementation.

**Planned changes:**
- Update `backend/main.mo` `getCategoriesWithProducts(offset: Nat, limit: Nat)` to sort categories by `order` ascending and paginate them using `sliceToArray(offset, endIndex)`.
- For each paginated category, filter products by `categoryId`, sort products with featured first then by `lastUpdatedDate` descending using the existing null-handling logic, and return at most 5 products via `sliceToArray(0, min(sortedProducts.size(), 5))` while keeping `productCount` as the total products in that category.

**User-visible outcome:** Requests to `getCategoriesWithProducts(0, N)` return up to `N` categories with correctly ordered products (featured first, then most recently updated) and a maximum of 5 products per category, while still reporting the full product count per category.
