# Specification

## Summary
**Goal:** Fix the ProductDetailModal double-click-to-close issue by correcting history state and popstate handling so the modal reliably closes with a single close action while preserving existing close behaviors.

**Planned changes:**
- Update `frontend/src/components/ProductDetailModal.tsx` to push exactly one history entry when the modal opens, tracked via a `historyPushedRef`.
- Implement a unified close handler guarded by an `isClosingRef` that uses `window.history.back()` only when a modal history entry was pushed; otherwise call `onClose()` directly.
- Add/adjust a `popstate` listener so that while the modal is open, it clears internal history-tracking refs and calls `onClose()` to reliably close the modal via browser back and via the close button’s `history.back()`.
- Keep overlay click-to-close and ESC-to-close behavior unchanged; do not alter modal structure, styling, layout, or close button positioning.

**User-visible outcome:** The ProductDetailModal closes with a single click on the close (X) button, and the browser back button closes the modal without navigating away from the current in-app page.
