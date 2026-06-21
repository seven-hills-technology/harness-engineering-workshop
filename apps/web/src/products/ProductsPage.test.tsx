import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProductsPage from './ProductsPage';
import * as api from '../lib/api';
import type { ProductListResponse } from '../lib/types';

vi.mock('../lib/api');

const sample = {
  products: [
    { id: 1, title: 'Test Mascara', price: 9.99, thumbnail: 't.jpg', availabilityStatus: 'In Stock' },
    { id: 2, title: 'Test Lipstick', price: 12.5, thumbnail: 't.jpg', availabilityStatus: 'Low Stock' },
  ],
  total: 2,
  skip: 0,
  limit: 24,
} as unknown as ProductListResponse;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getProducts).mockResolvedValue(sample);
    vi.mocked(api.getCategories).mockResolvedValue(['beauty', 'fragrances']);
  });

  it('renders products from the API', async () => {
    renderPage();
    expect(await screen.findByText('Test Mascara')).toBeInTheDocument();
    expect(screen.getByText('Test Lipstick')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('renders category filter options', async () => {
    renderPage();
    expect(await screen.findByRole('option', { name: 'beauty' })).toBeInTheDocument();
  });
});
