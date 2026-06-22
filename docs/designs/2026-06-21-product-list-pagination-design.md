# Design Discussion: Product List Pagination

**Date:** 2026-06-21
**Feature:** Let shoppers page through the full product catalog instead of being capped at the first 24 results.
**Visual mockup:** `docs/designs/2026-06-21-product-list-pagination-mockup.html` (Option B locked in via the lavish-axi feedback loop).

## Current State

The catalog page is `apps/web/src/products/ProductsPage.tsx` (route `/products`; note `/` is
the `LoginPage`, so "home page" here means the product catalog). It:

- Holds filter state (search, category, brand, sort, min/max price, min rating) via `useState`
  (`ProductsPage.tsx:7-13`).
- Calls `useProducts({ ..., limit: 24 })` with a **hard-coded limit and no `skip`**
  (`ProductsPage.tsx:15-24`), and renders `data.products.map(...)` into a CSS grid
  (`ProductsPage.tsx:123-127`). The returned `data.total` is **discarded**.

The backend is already pagination-complete:

- `GET /products` accepts `skip` (default 0) and `limit` (default 20, clamped to 100)
  — `apps/api/src/modules/products/products.controller.ts:36-50`.
- `ProductsService.findAll` runs `qb.skip(skip).take(limit)` + `getManyAndCount()` and returns
  `{ products, total, skip, limit }` — `apps/api/src/modules/products/products.service.ts:35-115`.
- Response shape `ProductListResponse = { products, total, skip, limit }` exists on both sides
  (`product.types.ts:13-18`, web `lib/types.ts:51-56`).
- The client already passes `skip`/`limit`: `ProductQuery` declares both and `api.getProducts`
  appends them (`apps/web/src/lib/api.ts:77-95`).

**So this is a UI-only change.** No API, service, DB, or type changes are required.

## Patterns to Follow

- **React Query hooks per feature** — `apps/web/src/products/queries.ts` (`useProducts`), keyed
  `['products', query]`. Pagination state flows through the query object, so the cache key
  updates automatically.
- **Inline Tailwind slate styling** — there are no shared Button/Pagination/Spinner primitives;
  controls are written inline (e.g. `controlClass` in `ProductsPage.tsx:28`). New controls follow
  the same slate palette and `rounded-lg border border-slate-300` look.
- **`data-testid` everywhere** — `search-input`, `category-select`, `product-card-*`, etc. New
  pagination controls get test ids so unit + Playwright e2e can target them.
- **Test conventions** — web: Vitest + Testing Library, `vi.mock('../lib/api')`, render in
  `QueryClientProvider` + `MemoryRouter` (`ProductsPage.test.tsx`). e2e: Playwright CLI bash
  scripts in `e2e/` (e.g. `search-filter.sh`).

## Desired End State

`ProductsPage` gains a `page` (or `skip`) state and renders a **numbered pager with Prev / Next**
below the grid (left-aligned), plus a result-count summary above the grid. The page reads
`data.total` to compute the page count and to render "Showing X–Y of N products". Changing any
filter resets pagination to the first page (so you never land on an out-of-range page). See the
mockup at `docs/designs/2026-06-21-product-list-pagination-mockup.html` for the agreed layout.

## Design Decisions

- **UI-only; reuse the existing backend contract.** No endpoint/service/type changes.
  *(Rationale: backend already supports `skip`/`limit`/`total` and is tested.)*
- **Page size stays 24.** Matches today's behavior; one product-grid "page" = 24 items.
- **Pagination state lives in `ProductsPage` `useState`**, threaded into `useProducts` as
  `skip` (and `limit`). *(Rationale: matches how every other filter already works; React Query
  re-fetches on key change for free.)*
- **Any filter change resets to page 1 / `skip: 0`.** *(Rationale: prevents empty pages when a
  narrower filter returns fewer total results.)*
- **UX = Option B: numbered pages + Prev / Next.** *(Decided in visual mockup — user chose
  Option B over Load-more and infinite scroll.)* Page count derives from `Math.ceil(total / limit)`.
  Prev is disabled on page 1, Next on the last page. The current page is rendered in the
  slate-900 filled style; other pages use the standard `border-slate-300` control style. For large
  page counts the pager collapses with a `…` ellipsis (e.g. `← Prev 1 2 3 4 … 6 Next →`).
- **Pager is bottom-of-grid and LEFT-aligned** (not centered). *(Decided in visual mockup — user
  rejected the centered placement.)*
- **Result-count summary sits above the grid, left-aligned** — `Showing 25–48 of 142 products`,
  derived from `skip` / `limit` / `total`. *(Decided in visual mockup.)*
- **`Page X of Y` indicator sits at the BOTTOM**, to the right of the pager on the same row — not
  in the top summary. *(Decided in visual mockup — user moved it from top to bottom.)*
- **Extract a small `Pagination` component** under `apps/web/src/components/` (the chosen numbered
  pager has enough markup/logic — page-window with ellipsis, disabled states — to warrant it, and
  it keeps `ProductsPage` readable). It takes `total`, `skip`, `limit`, and an `onPageChange`
  callback, and gets `data-testid` hooks for tests/e2e.
- **Product tiles are unchanged for this work** — no star ratings on the cards. *(Confirmed in
  visual mockup: "we're not doing the stars on the tiles yet." The mockup's tile is illustrative
  only; `ProductCard` is not touched by this feature.)*

## Open Questions

*(All resolved.)*

1. **Page in the URL query string vs in-memory?** **RESOLVED — in-memory `useState` only**
   (user approved 2026-06-21), matching the existing filters (search, category, sort) which are
   also not in the URL today.

## Testing Strategy

- **Unit (Vitest):** extend `ProductsPage.test.tsx` — mock `api.getProducts` to return a
  `total` larger than one page; assert the pager renders the right number of pages, that clicking
  a page / Next calls `getProducts` with the expected `skip`, that Prev/Next disable at the
  bounds, and that changing a filter resets `skip` to 0. Add a focused unit test for the new
  `Pagination` component (page-window/ellipsis math, disabled states) in
  `apps/web/src/components/Pagination.test.tsx`.
- **API:** no change; existing `products.service.search.spec.ts` already covers `skip`/`limit`.
- **e2e (Playwright CLI):** add/extend a script in `e2e/` to load `/products`, count cards,
  trigger the next page, and assert the product set advances.
- **Manual:** verify via the Playwright CLI run against web `:9010` / API `:8010`.
