---
title: "feat: Add numbered pagination to the product catalog page"
type: enhancement
status: completed
date: 2026-06-21
origin: docs/designs/2026-06-21-product-list-pagination-design.md
mockup: docs/designs/2026-06-21-product-list-pagination-mockup.html
detail_level: MORE
stack: [react, typescript]
---

# feat: Add numbered pagination to the product catalog page

## Problem / Summary

The product catalog page (`apps/web/src/products/ProductsPage.tsx`, route `/products`) is hard-capped
at the first 24 products: it calls `useProducts({ ..., limit: 24 })` with no `skip` and discards the
`total` the API already returns. Shoppers cannot browse beyond the first 24 results.

The **backend is already pagination-complete** — `GET /products` accepts `skip`/`limit` and returns
`{ products, total, skip, limit }` (`apps/api/src/modules/products/products.controller.ts:36-50`,
`products.service.ts:35-115`, covered by `products.service.search.spec.ts:142-163`). The client
contract is also ready: `ProductQuery` declares `skip`/`limit` and `api.getProducts` appends them
(`apps/web/src/lib/api.ts:77-95`). **This is therefore a UI-only change** — no API, service, DB, or
type changes.

The pagination UX was aligned in a visual mockup loop (Option B: numbered pages + Prev/Next). See the
design doc and mockup referenced in the frontmatter for the agreed layout and the rationale behind
each decision (see design: `docs/designs/2026-06-21-product-list-pagination-design.md`).

## Goals

- Let shoppers move through all pages of the catalog, 24 products per page.
- Show a result-count summary ("Showing X–Y of N products") and a "Page X of Y" indicator.
- Keep the change small, consistent with existing patterns, and fully tested.

## Non-Goals

- No backend/API/service/type changes (the contract already exists).
- No changes to `ProductCard` — **no star ratings on tiles** (out of scope; decided in mockup).
- Page state is **not** reflected in the URL (in-memory only; decided in design — matches existing
  filters, which are also not in the URL).
- No "Load more" / infinite scroll (Option B chosen over these).
- No pagination for orders or admin lists (separate work).

## Design Decisions (carried from the design doc)

All decided during the visual mockup loop unless noted (see design:
`docs/designs/2026-06-21-product-list-pagination-design.md`):

- **UX = numbered pages + Prev/Next** below the grid, **left-aligned** (centered placement rejected).
- **Page size = 24** (`limit`); page count = `Math.ceil(total / limit)`.
- **Result-count summary above the grid, left-aligned**: `Showing 25–48 of 142 products`.
- **`Page X of Y` indicator at the bottom**, to the right of the pager on the same row.
- **Extract a reusable `Pagination` component** at `apps/web/src/components/Pagination.tsx`.
- **Any filter change resets to page 1 (`skip: 0`)** so you never land on an out-of-range page.
- Current page rendered in the slate-900 filled style; other pages use the `border-slate-300`
  control style; `…` ellipsis collapses long page lists; Prev disabled on page 1, Next on last page.

## Technical Approach

### New component: `apps/web/src/components/Pagination.tsx`

A presentational, self-contained pager. Props:

```tsx
// apps/web/src/components/Pagination.tsx
type PaginationProps = {
  total: number;        // data.total from the API
  skip: number;         // current offset
  limit: number;        // page size (24)
  onPageChange: (skip: number) => void;
};
```

Behavior:
- `pageCount = Math.max(1, Math.ceil(total / limit))`; `currentPage = Math.floor(skip / limit) + 1`.
- Renders Prev / Next (disabled at the bounds) and a windowed list of page buttons with a `…`
  ellipsis when `pageCount` is large (mirror the mockup window: first, neighbors of current, last).
- Clicking page `n` calls `onPageChange((n - 1) * limit)`.
- Renders **nothing** (or just the summary host returns null) when `pageCount <= 1`.
- `data-testid` hooks: `pagination`, `pagination-prev`, `pagination-next`,
  `pagination-page-<n>`, and `aria-current="page"` on the active page. `aria-label="Product pages"`
  on the `<nav>`.
- Styling: inline Tailwind slate classes matching the mockup (`control` look:
  `rounded-lg border border-slate-300 px-3 py-2`; active: `bg-slate-900 text-white`).

### Wire into `apps/web/src/products/ProductsPage.tsx`

- Add `const [skip, setSkip] = useState(0);`.
- Pass `skip` (and keep `limit: 24`) into `useProducts({ ..., skip, limit: 24 })`.
- **Reset on filter change:** every existing filter setter must also reset `skip` to 0. Implement by
  resetting `skip` whenever any filter value changes (e.g. a small `useEffect` keyed on the filter
  values, or wrap each setter). Keep it simple and consistent — see Edge Cases.
- Above the grid (where the filter bar ends), render the **result-count summary**:
  `Showing {skip + 1}–{Math.min(skip + limit, total)} of {total} products` (guard `total === 0`).
- Below the grid, render `<Pagination total={data.total} skip={skip} limit={24} onPageChange={setSkip} />`
  and, to its right, the `Page {currentPage} of {pageCount}` indicator (can live inside the
  `Pagination` component or alongside it — keep markup matching the mockup row).
- Only render the summary + pager when `data` is loaded and `total > 0`.

No changes to `apps/web/src/products/queries.ts` are required — `useProducts` already keys on the
full query object, so changing `skip` re-fetches automatically and React Query caches each page.

## Implementation Phases

### Phase 1 — Numbered pagination on the catalog page (single vertical slice)

Files:
- `apps/web/src/components/Pagination.tsx` *(new)* — the reusable pager.
- `apps/web/src/products/ProductsPage.tsx` *(edit)* — `skip` state, summary, pager wiring,
  filter-reset.
- `apps/web/src/components/Pagination.test.tsx` *(new)* — unit tests for the component.
- `apps/web/src/products/ProductsPage.test.tsx` *(edit)* — integration-level tests for the page.
- `e2e/search-filter.sh` *(edit)* or `e2e/browse-pagination.sh` *(new)* — e2e page advance.

Testing checkpoint at the end of the phase (see Testing Strategy). This is the whole feature; it
cuts through component → page wiring → tests in one slice.

## Edge Cases & Flow Analysis

- **`total <= limit` (≤ 1 page):** pager renders nothing; summary still shows "Showing 1–N of N".
- **`total === 0` (no matches):** show the existing "No products match your search." message; no
  summary, no pager. (Current empty-state lives at `ProductsPage.tsx:129-131`.)
- **Filter change while on page > 1:** must reset `skip` to 0, otherwise a narrower result set can
  leave you on an out-of-range page showing zero products. This is the key correctness case — cover
  it in tests.
- **Last page partially full:** summary upper bound uses `Math.min(skip + limit, total)`.
- **Rapid page clicks / in-flight fetch:** React Query handles this; show the existing
  `isLoading` text. Keep the pager visible (don't unmount) to avoid layout jump — acceptable to
  keep it mounted using the last known `total`.
- **Large page counts:** ellipsis windowing keeps the control compact (mockup showed
  `← Prev 1 2 3 4 … 6 Next →`).

## Testing Strategy

**Unit — `Pagination.test.tsx` (new):**
- `pageCount` math: e.g. `total=142, limit=24` → 6 pages; current page highlighted from `skip`.
- Prev disabled on page 1; Next disabled on last page.
- Clicking page `n` / Next / Prev calls `onPageChange` with the expected `skip`.
- Renders nothing when `pageCount <= 1`.
- Ellipsis appears for large page counts.

**Unit/integration — `ProductsPage.test.tsx` (edit):** follow the existing convention
(`vi.mock('../lib/api')`, `QueryClientProvider` + `MemoryRouter`, assert via `getProducts.mock.calls`):
- Mock `getProducts` to resolve `{ products, total: 142, skip: 0, limit: 24 }`; assert summary text
  and that the pager renders 6 pages.
- Click page 2 / Next → asserts `getProducts` called with `skip: 24`.
- Change a filter (e.g. type in search) while on page 2 → asserts `skip` resets to 0 on the next
  `getProducts` call.

**API:** no change; existing `products.service.search.spec.ts` already covers `skip`/`limit`/`total`.

**E2E (Playwright CLI):** extend `e2e/search-filter.sh` (or add `e2e/browse-pagination.sh`) to load
`/products`, snapshot, click the Next/page-2 control via its `data-testid`, and assert the product
set advances (cards change / count reflects the next page). Follow the existing CLI script pattern
(`npx playwright-cli`, `snapshot`, `getByTestId`).

## Acceptance Criteria

- [x] On `/products` with more than 24 matching products, a numbered pager + Prev/Next renders
      below the grid, left-aligned.
- [x] A result-count summary "Showing X–Y of N products" renders above the grid.
- [x] A "Page X of Y" indicator renders at the bottom, to the right of the pager.
- [x] Clicking a page / Next / Prev loads the corresponding 24 products (correct `skip` sent to the API).
- [x] Prev is disabled on page 1; Next is disabled on the last page.
- [x] Changing any filter resets to page 1.
- [x] No pager (and no summary beyond the empty-state message) when 0 results; pager hidden when ≤ 1 page.
- [x] `ProductCard` is unchanged (no star ratings added).
- [x] New `Pagination` unit tests and updated `ProductsPage` tests pass; e2e page-advance check passes.
- [x] Web suite green (32/32) and pagination e2e passes; no coverage drop. **Note:** one
      *pre-existing* API failure unrelated to this change — `admin.service.spec.ts`
      "aggregates totals…" fails identically on `main` (cross-suite seed/DB state issue, not
      touched by this web-only feature). Tracked separately; out of scope for this plan.

## Sources

- **Design doc (origin):** `docs/designs/2026-06-21-product-list-pagination-design.md` — carries the
  full rationale; UX = Option B, left-aligned pager, bottom "Page X of Y", in-memory page state,
  no star ratings.
- **Visual mockup:** `docs/designs/2026-06-21-product-list-pagination-mockup.html` (v5; locked via
  the lavish-axi feedback loop).
- **Backend contract (already implemented):** `apps/api/src/modules/products/products.controller.ts:36-50`,
  `products.service.ts:35-115`, `product.types.ts:13-18`.
- **Client contract (already implemented):** `apps/web/src/lib/api.ts:77-95`, `lib/types.ts:51-56`,
  `apps/web/src/products/queries.ts:5-10`.
- **Page to change:** `apps/web/src/products/ProductsPage.tsx:15-24, 123-131`.
- **Test conventions:** `apps/web/src/products/ProductsPage.test.tsx`, `apps/web/src/test/setup.ts`,
  `e2e/search-filter.sh`.
