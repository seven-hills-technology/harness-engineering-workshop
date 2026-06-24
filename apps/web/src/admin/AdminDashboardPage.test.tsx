import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from './AdminDashboardPage';
import * as api from '../lib/api';
import type { AdminDashboard } from '../lib/types';

vi.mock('../lib/api');

const dashboard: AdminDashboard = {
  totals: { revenue: 1234.5, orderCount: 42, paidOrFulfilledCount: 30 },
  revenueByWeek: [
    { weekStart: '2026-06-01', revenue: 500, orders: 10 },
    { weekStart: '2026-06-08', revenue: 734.5, orders: 32 },
  ],
  topProducts: [
    { productId: 1, title: 'Aurora Lamp', units: 12, revenue: 600 },
    { productId: 2, title: 'Nebula Mug', units: 8, revenue: 160 },
  ],
  ordersByStatus: [
    { status: 'paid', count: 20 },
    { status: 'fulfilled', count: 10 },
  ],
  lowStock: [{ id: 7, title: 'Comet Notebook', stock: 3, lowStockThreshold: 10 }],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getAdminDashboard).mockResolvedValue(dashboard);
  });

  it('renders totals from the API', async () => {
    renderPage();
    expect(await screen.findByTestId('stat-revenue')).toHaveTextContent('$1234.50');
    expect(screen.getByTestId('stat-orders')).toHaveTextContent('42');
    expect(screen.getByTestId('stat-paid-fulfilled')).toHaveTextContent('30');
  });

  it('renders top products entries', async () => {
    renderPage();
    expect(await screen.findByText('Aurora Lamp')).toBeInTheDocument();
    expect(screen.getByText('Nebula Mug')).toBeInTheDocument();
    expect(screen.getByTestId('top-product-1')).toHaveTextContent('$600.00');
  });

  it('renders a seeded low-stock product row', async () => {
    renderPage();
    const row = await screen.findByTestId('low-stock-7');
    expect(row).toHaveTextContent('Comet Notebook');
    expect(row).toHaveTextContent('3');
    expect(row).toHaveTextContent('10');
  });
});
