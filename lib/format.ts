import { isPlaceholder } from "./placeholder";

const SYMBOLS: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };

export function formatPrice(value: unknown, currency: unknown): string {
  if (isPlaceholder(value) || isPlaceholder(currency)) return "Price on request";
  const sym = SYMBOLS[String(currency)] ?? `${currency} `;
  return `${sym}${Number(value).toFixed(2)}`;
}

export function formatDimensions(l: number, w: number, h: number): string {
  return `${l} × ${w} × ${h} mm`;
}

export function formatLeadTime(days: unknown): string {
  return isPlaceholder(days) ? "Contact for lead time" : `${days} business days`;
}
