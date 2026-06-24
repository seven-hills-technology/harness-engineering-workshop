import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReviewForm from './ReviewForm';
import * as api from '../lib/api';
import type { ProductDetail } from '../lib/types';

vi.mock('../lib/api');

const updatedProduct = {
  id: 1,
  title: 'Test Mascara',
  reviews: [{ id: 99, rating: 4, comment: 'Great!', reviewerName: 'Me', date: '2026-06-21' }],
  rating: 4,
} as unknown as ProductDetail;

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReviewForm productId={1} />
    </QueryClientProvider>,
  );
}

describe('ReviewForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders rating, comment fields and a submit button', () => {
    renderForm();
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  it('submits the entered rating and comment to api.createReview', async () => {
    vi.mocked(api.createReview).mockResolvedValue(updatedProduct);

    renderForm();
    await userEvent.selectOptions(screen.getByLabelText(/rating/i), '4');
    await userEvent.type(screen.getByLabelText(/your review/i), 'Great!');
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() =>
      expect(api.createReview).toHaveBeenCalledWith(1, { rating: 4, comment: 'Great!' }),
    );
  });

  it('clears the comment field on successful submit', async () => {
    vi.mocked(api.createReview).mockResolvedValue(updatedProduct);

    renderForm();
    const comment = screen.getByLabelText(/your review/i);
    await userEvent.type(comment, 'Great!');
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => expect(comment).toHaveValue(''));
  });

  it('disables the submit button while the request is pending', async () => {
    let resolve!: (value: ProductDetail) => void;
    vi.mocked(api.createReview).mockReturnValue(
      new Promise<ProductDetail>((r) => {
        resolve = r;
      }),
    );

    renderForm();
    await userEvent.type(screen.getByLabelText(/your review/i), 'Great!');
    const button = screen.getByRole('button', { name: /submit review/i });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    resolve(updatedProduct);
  });

  it('shows a validation error when the comment is empty', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(api.createReview).not.toHaveBeenCalled();
  });

  it('shows an error when the request fails', async () => {
    vi.mocked(api.createReview).mockRejectedValue(new Error('Server error'));

    renderForm();
    await userEvent.type(screen.getByLabelText(/your review/i), 'Nice');
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
  });
});
