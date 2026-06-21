import { Link } from 'react-router-dom';
import { useOrders } from './queries';
import OrderStatusBadge from './OrderStatusBadge';
import type { OrderView } from '../lib/types';

function itemCount(order: OrderView): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders();

  if (isLoading) return <p className="text-slate-500">Loading orders…</p>;
  if (isError) return <p className="text-red-600">Failed to load orders.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Your Orders</h1>

      {orders && orders.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-500">You have no orders yet.</p>
          <Link to="/products" className="mt-2 inline-block text-sm font-medium text-slate-900 hover:underline">
            Browse products →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders?.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">Order #{order.id}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()} · {itemCount(order)} item
                    {itemCount(order) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-medium text-slate-900">${order.total.toFixed(2)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
