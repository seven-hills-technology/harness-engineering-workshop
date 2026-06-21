import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart, cartCount } from '../cart/useCart';
import CartDrawer from '../cart/CartDrawer';

export default function Layout() {
  const { user, logout } = useAuth();
  const { data: cart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const count = cartCount(cart);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link to="/products" className="text-lg font-semibold text-slate-900">
            Workshop Store
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Orders
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-label={`Cart (${count} items)`}
            >
              Cart
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs text-white">
                  {count}
                </span>
              )}
            </button>
            {user && (
              <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
                Sign out
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
