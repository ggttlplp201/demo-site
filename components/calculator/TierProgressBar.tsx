import type { OrderResult } from "@/lib/pricing";

interface TierProgressBarProps {
  result: OrderResult;
}

export function TierProgressBar({ result }: TierProgressBarProps) {
  if (result.nextTier) {
    const currentTierMin = result.activeTier?.min_qty ?? 1;
    const nextTierMin = result.nextTier.min_qty;
    const range = nextTierMin - currentTierMin;
    const progress = range > 0
      ? Math.min(100, ((result.unitsToNextTier != null ? nextTierMin - result.unitsToNextTier : nextTierMin) - currentTierMin) / range * 100)
      : 0;

    return (
      <div className="space-y-1">
        <p className="text-xs text-aluminium-dark">
          Faltam {result.unitsToNextTier} para −{result.nextTier.discount_pct}%
        </p>
        <div className="h-1 rounded bg-aluminium overflow-hidden">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (result.activeTier) {
    return (
      <p className="text-xs text-aluminium-dark">
        Desconto activo: −{result.activeTier.discount_pct}%
      </p>
    );
  }

  return null;
}
