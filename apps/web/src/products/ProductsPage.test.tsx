import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// A multi-page result set (142 / 24 = 6 pages) for pagination assertions.
const paginated = {
  products: [
    { id: 1, title: 'Test Mascara', price: 9.99, thumbnail: 't.jpg', availabilityStatus: 'In Stock' },
    { id: 2, title: 'Test Lipstick', price: 12.5, thumbnail: 't.jpg', availabilityStatus: 'Low Stock' },
  ],
  total: 142,
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
    vi.mocked(api.getBrands).mockResolvedValue(['Essence', 'Glamour Beauty']);
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

  it('renders sort and brand controls', async () => {
    renderPage();
    expect(await screen.findByLabelText('Sort products')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by brand')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Essence' })).toBeInTheDocument();
  });

  it('queries with the selected sort value', async () => {
    const user = userEvent.setup();
    renderPage();

    const sortSelect = await screen.findByLabelText('Sort products');
    await user.selectOptions(sortSelect, 'price_asc');

    expect(
      vi.mocked(api.getProducts).mock.calls.some(
        ([query]) => query?.sort === 'price_asc',
      ),
    ).toBe(true);
  });

  it('queries with the selected brand value', async () => {
    const user = userEvent.setup();
    renderPage();

    // Brand options arrive from an async query — wait for one before selecting.
    await screen.findByRole('option', { name: 'Essence' });
    const brandSelect = screen.getByLabelText('Filter by brand');
    await user.selectOptions(brandSelect, 'Essence');

    expect(
      vi.mocked(api.getProducts).mock.calls.some(
        ([query]) => query?.brand === 'Essence',
      ),
    ).toBe(true);
  });

  describe('pagination', () => {
    beforeEach(() => {
      vi.mocked(api.getProducts).mockResolvedValue(paginated);
    });

    it('renders the result-count summary and a 6-page pager', async () => {
      renderPage();

      expect(await screen.findByText(/Showing/)).toHaveTextContent(
        'Showing 1–24 of 142 products',
      );
      expect(screen.getByTestId('pagination-page-6')).toBeInTheDocument();
      expect(screen.queryByTestId('pagination-page-7')).not.toBeInTheDocument();
    });

    it('requests skip 24 when page 2 is clicked', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(await screen.findByTestId('pagination-page-2'));

      expect(
        vi.mocked(api.getProducts).mock.calls.some(([query]) => query?.skip === 24),
      ).toBe(true);
    });

    it('requests skip 24 when Next is clicked', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(await screen.findByTestId('pagination-next'));

      expect(
        vi.mocked(api.getProducts).mock.calls.some(([query]) => query?.skip === 24),
      ).toBe(true);
    });

    it('resets to skip 0 when a filter changes while on a later page', async () => {
      const user = userEvent.setup();
      renderPage();

      // Advance to page 2 (skip 24).
      await user.click(await screen.findByTestId('pagination-page-2'));
      expect(
        vi.mocked(api.getProducts).mock.calls.some(([query]) => query?.skip === 24),
      ).toBe(true);

      vi.mocked(api.getProducts).mockClear();

      // Typing in search must reset pagination to the first page: the settled
      // query for the new search runs with skip 0, not the stale page-2 offset.
      await user.type(screen.getByTestId('search-input'), 'lip');

      const calls = vi.mocked(api.getProducts).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const [lastQuery] = calls[calls.length - 1];
      expect(lastQuery?.search).toBe('lip');
      expect(lastQuery?.skip).toBe(0);
    });
  });
});
