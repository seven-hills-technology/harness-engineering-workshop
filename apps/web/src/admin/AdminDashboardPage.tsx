import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboard } from './queries';
import type {
  AdminDashboardTotals,
  LowStockItem,
  OrdersByStatusPoint,
  RevenueByWeekPoint,
  TopProduct,
} from '../lib/types';

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  fulfilled: '#10b981',
  cancelled: '#ef4444',
};

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900" data-testid={testId}>
        {value}
      </p>
    </Card>
  );
}

function TotalsRow({ totals }: { totals: AdminDashboardTotals }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Revenue" value={formatCurrency(totals.revenue)} testId="stat-revenue" />
      <StatCard label="Orders" value={String(totals.orderCount)} testId="stat-orders" />
      <StatCard
        label="Paid / Fulfilled"
        value={String(totals.paidOrFulfilledCount)}
        testId="stat-paid-fulfilled"
      />
    </div>
  );
}

function RevenueChart({ data }: { data: RevenueByWeekPoint[] }) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-slate-900">Revenue over time</h2>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">No revenue data yet.</p>
      ) : (
        <div
          role="img"
          aria-label={`Revenue over time. Latest week ${data[data.length - 1].weekStart}: ${formatCurrency(data[data.length - 1].revenue)}.`}
        >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="weekStart" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function OrdersByStatusChart({ data }: { data: OrdersByStatusPoint[] }) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-slate-900">Orders by status</h2>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">No orders yet.</p>
      ) : (
        <div
          role="img"
          aria-label={`Orders by status: ${data.map((d) => `${d.count} ${d.status}`).join(', ')}.`}
        >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function TopProductsTable({ products }: { products: TopProduct[] }) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-slate-900">Top products</h2>
      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No product sales yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="top-products-table">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 text-right font-medium">Units</th>
                <th className="py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr
                  key={product.productId}
                  className="border-b border-slate-100 last:border-0"
                  data-testid={`top-product-${product.productId}`}
                >
                  <td className="py-2 pr-4 text-slate-400">{index + 1}</td>
                  <td className="py-2 pr-4 font-medium text-slate-900">{product.title}</td>
                  <td className="py-2 pr-4 text-right text-slate-700">{product.units}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function LowStockTable({ items }: { items: LowStockItem[] }) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-slate-900">Low stock</h2>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500" data-testid="low-stock-empty">
          All products are well stocked.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="low-stock-table">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 text-right font-medium">Stock</th>
                <th className="py-2 text-right font-medium">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0"
                  data-testid={`low-stock-${item.id}`}
                >
                  <td className="py-2 pr-4 font-medium text-slate-900">{item.title}</td>
                  <td className="py-2 pr-4 text-right font-medium text-amber-600">{item.stock}</td>
                  <td className="py-2 text-right text-slate-500">{item.lowStockThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <p className="text-slate-500">Loading dashboard…</p>;
  if (isError || !data) return <p className="text-red-600">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>

      <TotalsRow totals={data.totals} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={data.revenueByWeek} />
        <OrdersByStatusChart data={data.ordersByStatus} />
        <TopProductsTable products={data.topProducts} />
        <LowStockTable items={data.lowStock} />
      </div>
    </div>
  );
}
