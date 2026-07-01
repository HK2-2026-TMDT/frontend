import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewService, type ReviewSummary } from '../../services/endpoints/reviewService';

export const WorkshopRatingBadge = ({ workshopId }: { workshopId: number }) => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    reviewService
      .getWorkshopSummary(workshopId)
      .then((res) => {
        if (mounted) setSummary(res.data.data ?? null);
      })
      .catch(() => {
        if (mounted) setSummary(null);
      });
    return () => {
      mounted = false;
    };
  }, [workshopId]);

  if (!summary || !summary.totalReviews) return null;

  return (
    <Link
      to={`/workshop/${workshopId}`}
      className="inline-flex items-center gap-1 text-sm text-amber-700 hover:underline"
    >
      <span
        className="material-symbols-outlined text-base text-amber-500"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      {Number(summary.averageRating).toFixed(1)} ({summary.totalReviews} đánh giá)
    </Link>
  );
};
