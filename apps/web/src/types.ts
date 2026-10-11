/**
 * Frontend copies of the types the UI needs (match packages/shared/src/types.ts
 * and the API responses in Section 9 of the spec). If the web app depends on
 * @campus-unjumbled/shared, these can be replaced with imports from it.
 */

export const BRANCHES = [
  "CS",
  "IT",
  "ECE",
  "EE",
  "ME",
  "CE",
  "Mining",
  "Production",
  "Other",
] as const;

export type Branch = (typeof BRANCHES)[number];
export type Difficulty = "easy" | "medium" | "hard";
export type SpeedTier = "ace" | "par" | "double_par" | "slow";

export interface StoredPlayer {
  id: string;
  name: string;
  branch: Branch;
}

/** Puzzle as returned by GET /puzzles and /puzzles/:id (never includes the location name). */
export interface PuzzleSummary {
  id: string;
  image_url: string;
  difficulty: Difficulty;
  grid_size?: number;
}

export interface EndAttemptResult {
  base_score: number;
  speed_tier: SpeedTier;
  duration_ms: number;
}

export interface GambleResult {
  final_score: number;
  answer_correct: boolean | null;
  location_name: string;
}

export interface PlayerBadgeRow {
  player_id: string;
  badge_id: string;
  attempt_id: string;
  earned_at: string;
}

/** Router state passed Game -> DoubleOrNothing. */
export interface GambleState {
  attemptId: string;
  puzzleId: string;
  imageUrl: string;
  baseScore: number;
  speedTier: SpeedTier;
  durationMs: number;
  moveCount: number;
}

/** Router state passed DoubleOrNothing -> Results. */
export interface ResultsState extends GambleState {
  gambleChoice: "accepted" | "rejected";
  finalScore: number;
  answerCorrect: boolean | null;
  locationName: string;
}

export const GRID_SIZE: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };
