import { Link, useParams } from 'react-router-dom';
import { useOrder } from './queries';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useOrder(orderId);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (isError || !order) return <p className="text-red-600">Order not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/orders" className="text-sm text-slate-500 hover:underline">
        ← Back to orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Order #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Placed {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <ul className="divide-y divide-slate-200">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} × ${item.unitPrice.toFixed(2)}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-900">
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd>${order.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-lg font-semibold text-slate-900">
            <dt>Total</dt>
            <dd>${order.total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <Link
        to="/products"
        className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700"
      >
        Continue shopping
      </Link>
    </div>
  );
}
