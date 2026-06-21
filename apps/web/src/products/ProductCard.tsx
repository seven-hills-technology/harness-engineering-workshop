import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';

interface ProductCardProps {
  product: Product;
  /** Show the availability status line (used on the main grid, omitted for related). */
  showAvailability?: boolean;
}

export default function ProductCard({ product, showAvailability = false }: ProductCardProps) {
  return (
    <li
      className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/products/${product.id}`} className="block">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="mb-2 aspect-square w-full rounded-lg object-cover"
        />
        <p className="line-clamp-1 text-sm font-medium text-slate-900">{product.title}</p>
        <p className="text-sm text-slate-500">${product.price.toFixed(2)}</p>
        {showAvailability && (
          <p className="mt-1 text-xs text-slate-400">{product.availabilityStatus}</p>
        )}
      </Link>
    </li>
  );
}
