import { useParams, Link } from 'react-router-dom';
import { useProduct } from './queries';
import { useCartMutations } from '../cart/useCart';

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { data: product, isLoading, isError } = useProduct(productId);
  const { add } = useCartMutations();

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (isError || !product) return <p className="text-red-600">Product not found.</p>;

  const outOfStock = product.availableStock <= 0;

  return (
    <div>
      <Link to="/products" className="text-sm text-slate-500 hover:underline">
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="aspect-square w-full rounded-xl object-cover ring-1 ring-slate-200"
        />

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{product.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {product.brand} · {product.category}
          </p>
          <p className="mt-4 text-3xl font-bold text-slate-900">${product.price.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-500">
            {product.availabilityStatus} · {product.availableStock} available
          </p>
          <p className="mt-4 text-slate-700">{product.description}</p>

          <button
            disabled={outOfStock || add.isPending}
            onClick={() => add.mutate({ productId: product.id, quantity: 1 })}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {outOfStock ? 'Out of stock' : add.isPending ? 'Adding…' : 'Add to cart'}
          </button>
          {add.isError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {add.error instanceof Error ? add.error.message : 'Could not add to cart'}
            </p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">
          Reviews ({product.reviews?.length ?? 0})
        </h2>
        <ul className="mt-3 space-y-3">
          {product.reviews?.map((r) => (
            <li key={r.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-sm font-medium">
                {r.reviewerName} · {'★'.repeat(r.rating)}
              </p>
              <p className="text-sm text-slate-600">{r.comment}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
