import { useEffect, useState } from 'react';
import type { ProductSort } from '../lib/api';
import { useProducts, useCategories, useBrands } from './queries';
import ProductCard from './ProductCard';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 24;

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState<ProductSort | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [skip, setSkip] = useState(0);

  // Any filter change resets to the first page so a narrower result set never
  // leaves the user on an out-of-range page.
  useEffect(() => {
    setSkip(0);
  }, [search, category, brand, sort, minPrice, maxPrice, minRating]);

  const { data, isLoading, isError } = useProducts({
    search,
    category,
    brand: brand || undefined,
    sort: sort || undefined,
    minPrice: minPrice === '' ? undefined : Number(minPrice),
    maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
    minRating: minRating === '' ? undefined : Number(minRating),
    skip,
    limit: PAGE_SIZE,
  });
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const controlClass = 'rounded-lg border border-slate-300 px-3 py-2';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
          data-testid="search-input"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          data-testid="category-select"
          className={controlClass}
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter by brand"
          data-testid="brand-select"
          className={controlClass}
        >
          <option value="">All brands</option>
          {brands?.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ProductSort | '')}
          aria-label="Sort products"
          data-testid="sort-select"
          className={controlClass}
        >
          <option value="">Relevance</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="rating_desc">Rating</option>
          <option value="title_asc">Title</option>
        </select>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          aria-label="Minimum price"
          data-testid="min-price-input"
          className={`w-24 ${controlClass}`}
        />
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          aria-label="Maximum price"
          data-testid="max-price-input"
          className={`w-24 ${controlClass}`}
        />
        <select
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          aria-label="Minimum rating"
          data-testid="min-rating-select"
          className={controlClass}
        >
          <option value="">Any rating</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Loading products…</p>}
      {isError && <p className="text-red-600">Failed to load products.</p>}

      {data && data.total > 0 && (
        <div className="mb-4">
          <span className="text-sm text-slate-500">
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, data.total)} of {data.total} products
          </span>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data?.products.map((p) => (
          <ProductCard key={p.id} product={p} showAvailability />
        ))}
      </ul>

      {data && data.products.length === 0 && (
        <p className="text-slate-500">No products match your search.</p>
      )}

      {data && data.total > 0 && (
        <Pagination total={data.total} skip={skip} limit={PAGE_SIZE} onPageChange={setSkip} />
      )}
    </div>
  );
}
