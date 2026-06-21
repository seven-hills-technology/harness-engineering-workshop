import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';
import * as api from '../lib/api';
import type { CartView, OrderView } from '../lib/types';

vi.mock('../lib/api');

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'a@b.com', isAdmin: false } }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const cart = {
  items: [
    { productId: 1, title: 'Test Mascara', thumbnail: 't.jpg', price: 9.99, quantity: 2, availableStock: 5 },
  ],
  expiresAt: null,
} as CartView;

const order = { id: 42, status: 'pending', subtotal: 19.98, total: 19.98, createdAt: '2026-06-21T00:00:00Z', items: [] } as OrderView;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCart).mockResolvedValue(cart);
    vi.mocked(api.createOrder).mockResolvedValue(order);
  });

  it('renders cart line items and total', async () => {
    renderPage();
    expect(await screen.findByText('Test Mascara')).toBeInTheDocument();
    expect(screen.getByText('2 × $9.99')).toBeInTheDocument();
    // appears twice: line-item subtotal and order total
    expect(screen.getAllByText('$19.98')).toHaveLength(2);
  });

  it('places an order and navigates to the new order', async () => {
    renderPage();
    const button = await screen.findByTestId('place-order-button');
    await userEvent.click(button);

    expect(api.createOrder).toHaveBeenCalled();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/orders/42'));
  });
});
