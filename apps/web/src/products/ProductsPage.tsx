import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCategories } from './queries';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { data, isLoading, isError } = useProducts({ search, category, limit: 24 });
  const { data: categories } = useCategories();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Loading products…</p>}
      {isError && <p className="text-red-600">Failed to load products.</p>}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data?.products.map((p) => (
          <li key={p.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <Link to={`/products/${p.id}`} className="block">
              <img
                src={p.thumbnail}
                alt={p.title}
                className="mb-2 aspect-square w-full rounded-lg object-cover"
              />
              <p className="line-clamp-1 text-sm font-medium text-slate-900">{p.title}</p>
              <p className="text-sm text-slate-500">${p.price.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-400">{p.availabilityStatus}</p>
            </Link>
          </li>
        ))}
      </ul>

      {data && data.products.length === 0 && (
        <p className="text-slate-500">No products match your search.</p>
      )}
    </div>
  );
}
