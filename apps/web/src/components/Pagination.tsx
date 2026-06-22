interface PaginationProps {
  total: number;
  skip: number;
  limit: number;
  onPageChange: (skip: number) => void;
}

const controlClass = 'rounded-lg border border-slate-300 px-3 py-2';

const ELLIPSIS = '…' as const;
type PageItem = number | typeof ELLIPSIS;

/**
 * Build the windowed list of page numbers to display, inserting an ellipsis
 * marker where pages are collapsed. Always shows the first page, the last page,
 * and the current page plus its immediate neighbors.
 */
function buildPageItems(currentPage: number, pageCount: number): PageItem[] {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(pageCount);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) items.push(ELLIPSIS);
    items.push(page);
    prev = page;
  }
  return items;
}

export default function Pagination({ total, skip, limit, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(skip / limit) + 1;

  if (pageCount <= 1) return null;

  const goToPage = (page: number) => onPageChange((page - 1) * limit);

  const items = buildPageItems(currentPage, pageCount);

  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <nav className="flex items-center gap-1.5" aria-label="Product pages" data-testid="pagination">
        <button
          type="button"
          className={`${controlClass} font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          data-testid="pagination-prev"
        >
          ← Prev
        </button>
        {items.map((item, index) =>
          item === ELLIPSIS ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400" aria-hidden="true">
              {ELLIPSIS}
            </span>
          ) : item === currentPage ? (
            <button
              type="button"
              key={item}
              className="rounded-lg bg-slate-900 px-3.5 py-2 font-medium text-white"
              aria-current="page"
              disabled
              data-testid={`pagination-page-${item}`}
            >
              {item}
            </button>
          ) : (
            <button
              type="button"
              key={item}
              className={`${controlClass} hover:bg-slate-50`}
              onClick={() => goToPage(item)}
              data-testid={`pagination-page-${item}`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${controlClass} font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= pageCount}
          data-testid="pagination-next"
        >
          Next →
        </button>
      </nav>
      <span className="text-sm text-slate-400">
        Page {currentPage} of {pageCount}
      </span>
    </div>
  );
}
