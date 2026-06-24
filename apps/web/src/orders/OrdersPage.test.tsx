import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import OrdersPage from './OrdersPage';
import * as api from '../lib/api';
import type { OrderView } from '../lib/types';

vi.mock('../lib/api');

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'a@b.com', isAdmin: false } }),
}));

const orders = [
  {
    id: 2,
    status: 'paid',
    subtotal: 30,
    total: 30,
    createdAt: '2026-06-20T00:00:00Z',
    items: [{ productId: 1, title: 'A', quantity: 1, unitPrice: 30 }],
  },
  {
    id: 1,
    status: 'fulfilled',
    subtotal: 50,
    total: 50,
    createdAt: '2026-06-19T00:00:00Z',
    items: [{ productId: 2, title: 'B', quantity: 2, unitPrice: 25 }],
  },
] as OrderView[];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getOrders).mockResolvedValue(orders);
  });

  it('renders a list of orders from the API', async () => {
    renderPage();
    expect(await screen.findByText('Order #2')).toBeInTheDocument();
    expect(screen.getByText('Order #1')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('fulfilled')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
  });
});
