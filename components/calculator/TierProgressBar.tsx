"use client";

import type { OrderResult } from "@/lib/pricing";
import { useT } from "@/state/locale";

interface TierProgressBarProps {
  result: OrderResult;
}

export function TierProgressBar({ result }: TierProgressBarProps) {
  const t = useT();

  if (result.nextTier) {
    const currentTierMin = result.activeTier?.min_qty ?? 1;
    const nextTierMin = result.nextTier.min_qty;
    const range = nextTierMin - currentTierMin;
    const progress = range > 0
      ? Math.min(100, ((result.unitsToNextTier != null ? nextTierMin - result.unitsToNextTier : nextTierMin) - currentTierMin) / range * 100)
      : 0;

    const toNextLabel = t("tier.toNext")
      .replace("{n}", String(result.unitsToNextTier ?? 0))
      .replace("{p}", String(result.nextTier.discount_pct));

    return (
      <div className="space-y-1">
        <p className="text-xs text-aluminium-dark">
          {toNextLabel}
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
        {t("tier.active")}: −{result.activeTier.discount_pct}%
      </p>
    );
  }

  return null;
}
