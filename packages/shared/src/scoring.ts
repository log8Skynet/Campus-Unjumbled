import { Puzzle, SpeedTier } from "./types";

export function speedTier(durationMs: number, puzzle: Puzzle): SpeedTier {
  if (durationMs <= puzzle.ace_time_ms)            return "ace";
  if (durationMs <= puzzle.par_time_ms)            return "par";
  if (durationMs <= puzzle.par_time_ms * 2)        return "double_par";
  return "slow";
}

export function baseScore(durationMs: number, puzzle: Puzzle): number {
  const multipliers: Record<SpeedTier, number> = {
    ace: 1.0, par: 0.75, double_par: 0.5, slow: 0.25,
  };
  return Math.round(puzzle.max_score * multipliers[speedTier(durationMs, puzzle)]);
}

export function finalScore(
  base: number,
  gamble: "accepted" | "rejected",
  correct: boolean
): number {
  if (gamble === "rejected") return base;
  return correct ? base * 2 : 0;
}