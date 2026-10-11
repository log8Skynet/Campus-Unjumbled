export type Branch =
  | "CSE" | "IT" | "ECE" | "EE" | "ME" | "CE" | "Mining" | "Production" | "Cyber" | "Metal" | "Civil";

export type Difficulty = "easy" | "medium" | "hard"; // 3×3 | 4×4 | 5×5

export type SpeedTier = "ace" | "par" | "double_par" | "slow";

export interface Player {
  id: string;           // uuid
  name: string;
  branch: Branch;
  device_token: string; // SHA-256 of browser fingerprint, anti-spam
  created_at: string;
}

export interface Puzzle {
  id: string;           // uuid
  config_id: string;    // matches config/puzzles.json id (e.g. "main-gate")
  image_url: string;    // Supabase Storage public URL
  difficulty: Difficulty;
  location_name: string;         // canonical answer
  location_aliases: string[];    // fuzzy match set
  ace_time_ms: number;
  par_time_ms: number;
  max_score: number;             // default 1000
  published: boolean;
  created_at: string;
}

export interface Attempt {
  id: string;           // uuid
  player_id: string;
  puzzle_id: string;
  start_ts: string;     // server-set ISO timestamp
  end_ts: string | null;
  duration_ms: number | null;    // computed server-side
  move_count: number;
  gamble_choice: "accepted" | "rejected" | null;
  answer_given: string | null;
  answer_correct: boolean | null;
  final_score: number | null;
  speed_tier: SpeedTier | null;
  created_at: string;
}

export interface Badge {
  id: string;           // slug e.g. "speedster"
  name: string;
  description: string;
  icon: string;         // emoji
}

export interface PlayerBadge {
  player_id: string;
  badge_id: string;
  attempt_id: string;
  earned_at: string;
}