import { useState, type FormEvent } from 'react';
import { useCreateReview } from './queries';

interface ReviewFormProps {
  productId: number;
}

const RATINGS = [1, 2, 3, 4, 5];

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const create = useCreateReview(productId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setValidationError('Please choose a rating from 1 to 5.');
      return;
    }
    const trimmed = comment.trim();
    if (!trimmed) {
      setValidationError('Please write a review.');
      return;
    }

    create.mutate(
      { rating, comment: trimmed },
      {
        onSuccess: () => {
          setComment('');
          setRating(5);
        },
      },
    );
  };

  const errorMessage = validationError
    ? validationError
    : create.isError
      ? create.error instanceof Error
        ? create.error.message
        : 'Could not submit review'
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-lg bg-white p-4 ring-1 ring-slate-200"
    >
      <h3 className="text-base font-semibold text-slate-900">Write a review</h3>

      <div className="mt-3">
        <label htmlFor="review-rating" className="block text-sm font-medium text-slate-700">
          Rating
        </label>
        <select
          id="review-rating"
          data-testid="review-rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border-0 px-3 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-400"
        >
          {RATINGS.map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? 'star' : 'stars'}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700">
          Your review
        </label>
        <textarea
          id="review-comment"
          data-testid="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          aria-required="true"
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? 'review-error' : undefined}
          className="mt-1 w-full rounded-lg border-0 px-3 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <button
        type="submit"
        data-testid="review-submit"
        disabled={create.isPending}
        className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {create.isPending ? 'Submitting…' : 'Submit review'}
      </button>

      {errorMessage && (
        <p id="review-error" role="alert" className="mt-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
