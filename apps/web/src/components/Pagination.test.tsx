import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('computes page count and highlights the current page from skip', () => {
    render(<Pagination total={142} skip={0} limit={24} onPageChange={vi.fn()} />);

    // 142 / 24 = 5.9 → 6 pages.
    expect(screen.getByTestId('pagination-page-6')).toBeInTheDocument();
    expect(screen.queryByTestId('pagination-page-7')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 6')).toBeInTheDocument();

    const page1 = screen.getByTestId('pagination-page-1');
    expect(page1).toHaveAttribute('aria-current', 'page');
  });

  it('disables Prev on the first page', () => {
    render(<Pagination total={142} skip={0} limit={24} onPageChange={vi.fn()} />);

    expect(screen.getByTestId('pagination-prev')).toBeDisabled();
    expect(screen.getByTestId('pagination-next')).not.toBeDisabled();
  });

  it('disables Next on the last page', () => {
    // skip 120 → page 6 of 6.
    render(<Pagination total={142} skip={120} limit={24} onPageChange={vi.fn()} />);

    expect(screen.getByTestId('pagination-next')).toBeDisabled();
    expect(screen.getByTestId('pagination-prev')).not.toBeDisabled();
    expect(screen.getByText('Page 6 of 6')).toBeInTheDocument();
  });

  it('calls onPageChange with the expected skip when a page is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    // skip 48 → page 3 active, so pages 3 and 4 are within the visible window.
    render(<Pagination total={142} skip={48} limit={24} onPageChange={onPageChange} />);

    await user.click(screen.getByTestId('pagination-page-4'));
    // Page 4 → skip (4 - 1) * 24 = 72.
    expect(onPageChange).toHaveBeenCalledWith(72);
  });

  it('calls onPageChange when Next is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination total={142} skip={0} limit={24} onPageChange={onPageChange} />);

    await user.click(screen.getByTestId('pagination-next'));
    expect(onPageChange).toHaveBeenCalledWith(24);
  });

  it('calls onPageChange when Prev is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    // skip 48 → page 3; Prev goes to page 2 → skip 24.
    render(<Pagination total={142} skip={48} limit={24} onPageChange={onPageChange} />);

    await user.click(screen.getByTestId('pagination-prev'));
    expect(onPageChange).toHaveBeenCalledWith(24);
  });

  it('renders nothing when there is one page or fewer', () => {
    const { container } = render(
      <Pagination total={20} skip={0} limit={24} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('renders an ellipsis for large page counts', () => {
    // 240 / 24 = 10 pages, current page 1 → first, neighbors, last collapsed.
    render(<Pagination total={240} skip={0} limit={24} onPageChange={vi.fn()} />);

    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-10')).toBeInTheDocument();
    // A middle page far from the current page is collapsed away.
    expect(screen.queryByTestId('pagination-page-5')).not.toBeInTheDocument();
  });
});
