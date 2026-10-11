import type { SpeedTier } from "./types";

const pad = (v: number) => String(v).padStart(2, "0");

/** 83450 -> "01:23.4" (MM:SS.d) */
export function formatDuration(ms: number): string {
  const tenthsTotal = Math.floor(Math.max(0, ms) / 100);
  const tenths = tenthsTotal % 10;
  const secs = Math.floor(tenthsTotal / 10) % 60;
  const mins = Math.floor(tenthsTotal / 600);
  return `${pad(mins)}:${pad(secs)}.${tenths}`;
}

export const TIER_LABELS: Record<SpeedTier, string> = {
  ace: "Ace",
  par: "Par",
  double_par: "Double par",
  slow: "Slow",
};
