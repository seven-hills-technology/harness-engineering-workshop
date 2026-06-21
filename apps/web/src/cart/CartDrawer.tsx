import { useNavigate } from 'react-router-dom';
import { useCart, useCartMutations } from './useCart';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const { update, remove } = useCartMutations();

  if (!open) return null;

  const items = cart?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Cart">
      <div className="flex-1 bg-black/30" onClick={onClose} aria-hidden />
      <aside className="flex w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900" aria-label="Close cart">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-slate-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <img src={item.thumbnail} alt="" className="h-16 w-16 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        className="h-6 w-6 rounded border border-slate-300"
                        aria-label={`Decrease ${item.title}`}
                        onClick={() =>
                          update.mutate({ productId: item.productId, quantity: item.quantity - 1 })
                        }
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        className="h-6 w-6 rounded border border-slate-300 disabled:opacity-40"
                        aria-label={`Increase ${item.title}`}
                        disabled={item.quantity >= item.availableStock}
                        onClick={() =>
                          update.mutate({ productId: item.productId, quantity: item.quantity + 1 })
                        }
                      >
                        +
                      </button>
                      <button
                        className="ml-auto text-sm text-red-600 hover:underline"
                        onClick={() => remove.mutate(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-slate-200 p-4">
          <div className="mb-3 flex justify-between font-medium">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => {
              onClose();
              navigate('/checkout');
            }}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Checkout
          </button>
        </footer>
      </aside>
    </div>
  );
}
