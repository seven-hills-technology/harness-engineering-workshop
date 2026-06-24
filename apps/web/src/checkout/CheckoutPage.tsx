import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/useCart';
import { useCheckout } from '../orders/queries';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const checkout = useCheckout();

  const items = cart?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const placeOrder = () => {
    checkout.mutate(undefined, {
      onSuccess: (order) => navigate(`/orders/${order.id}`),
    });
  };

  if (isLoading) return <p className="text-slate-500">Loading…</p>;

  // Empty cart and not mid-checkout → nothing to buy, send back to products.
  if (items.length === 0 && !checkout.isPending && !checkout.isSuccess) {
    return <Navigate to="/products" replace />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/products" className="text-sm text-slate-500 hover:underline">
        ← Continue shopping
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Checkout</h1>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <ul className="divide-y divide-slate-200">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <img src={item.thumbnail} alt="" className="h-14 w-14 rounded object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        data-testid="place-order-button"
        disabled={items.length === 0 || checkout.isPending}
        onClick={placeOrder}
        className="mt-6 w-full rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {checkout.isPending ? 'Placing order…' : 'Place order'}
      </button>

      {checkout.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {checkout.error instanceof Error ? checkout.error.message : 'Could not place order'}
        </p>
      )}
    </div>
  );
}
