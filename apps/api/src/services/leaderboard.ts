import { supabase } from "../db/supabase";
import { AppError } from "../errors";

export type LeaderboardRow = {
  rank: number;
  player_name: string;
  branch: string;
  score: number;
  duration_ms: number;
  move_count: number;
};

export type GlobalLeaderboardRow = {
  rank: number;
  player_name: string;
  branch: string;
  total_score: number;
  puzzles_completed: number;
};

// ---------------------------------------------------------------------------
// getPuzzleLeaderboard
// One row per player (best attempt). Tie-break: score DESC → time ASC → moves ASC.
// ---------------------------------------------------------------------------

export async function getPuzzleLeaderboard(
  puzzleId: string,
  branch?: string,
  limit = 50
): Promise<LeaderboardRow[]> {
  // Only count attempts that are fully resolved (ended + gamble submitted).
  const { data, error } = await supabase
    .from("attempts")
    .select(
      "player_id, final_score, duration_ms, move_count, players(name, branch)"
    )
    .eq("puzzle_id", puzzleId)
    .not("end_ts", "is", null)
    .not("final_score", "is", null)
    .not("gamble_choice", "is", null);

  if (error) throw new AppError("DB_ERROR", 500, error.message);
  if (!data || data.length === 0) return [];

  // Supabase types joined relations as T[] even on a many-to-one join.
  // The actual runtime value is a single object; we cast through unknown so
  // TypeScript accepts our concrete Row shape.
  type SupabaseRow = {
    player_id: string;
    final_score: number;
    duration_ms: number;
    move_count: number;
    players: { name: string; branch: string } | { name: string; branch: string }[];
  };

  type Row = {
    player_id: string;
    final_score: number;
    duration_ms: number;
    move_count: number;
    players: { name: string; branch: string };
  };

  function unwrapPlayers(r: SupabaseRow): Row {
    const p = Array.isArray(r.players) ? r.players[0] : r.players;
    return { ...r, players: p };
  }

  // Keep best attempt per player using spec tie-break order.
  const bestByPlayer = new Map<string, Row>();

  for (const row of (data as unknown as SupabaseRow[]).map(unwrapPlayers)) {
    const existing = bestByPlayer.get(row.player_id);
    if (!existing) {
      bestByPlayer.set(row.player_id, row);
      continue;
    }

    const better =
      row.final_score > existing.final_score ||
      (row.final_score === existing.final_score &&
        row.duration_ms < existing.duration_ms) ||
      (row.final_score === existing.final_score &&
        row.duration_ms === existing.duration_ms &&
        row.move_count < existing.move_count);

    if (better) bestByPlayer.set(row.player_id, row);
  }

  let rows = Array.from(bestByPlayer.values());

  if (branch) rows = rows.filter((r) => r.players.branch === branch);

  rows.sort((a, b) => {
    if (b.final_score !== a.final_score) return b.final_score - a.final_score;
    if (a.duration_ms !== b.duration_ms) return a.duration_ms - b.duration_ms;
    return a.move_count - b.move_count;
  });

  return rows.slice(0, limit).map((r, i) => ({
    rank: i + 1,
    player_name: r.players.name,
    branch: r.players.branch,
    score: r.final_score,
    duration_ms: r.duration_ms,
    move_count: r.move_count,
  }));
}

// ---------------------------------------------------------------------------
// getGlobalLeaderboard
// Each player's total = sum of their best final_score per puzzle.
// Tie-break: total_score DESC → puzzles_completed DESC.
// ---------------------------------------------------------------------------

export async function getGlobalLeaderboard(
  branch?: string,
  limit = 50
): Promise<GlobalLeaderboardRow[]> {
  const { data, error } = await supabase
    .from("attempts")
    .select("player_id, puzzle_id, final_score, players(name, branch)")
    .not("end_ts", "is", null)
    .not("final_score", "is", null)
    .not("gamble_choice", "is", null);

  if (error) throw new AppError("DB_ERROR", 500, error.message);
  if (!data || data.length === 0) return [];

  // Supabase types joined relations as T[] even on a many-to-one join.
  type SupabaseRowGlobal = {
    player_id: string;
    puzzle_id: string;
    final_score: number;
    players: { name: string; branch: string } | { name: string; branch: string }[];
  };

  type Row = {
    player_id: string;
    puzzle_id: string;
    final_score: number;
    players: { name: string; branch: string };
  };

  function unwrapPlayersGlobal(r: SupabaseRowGlobal): Row {
    const p = Array.isArray(r.players) ? r.players[0] : r.players;
    return { ...r, players: p };
  }

  // Step 1: best score per (player, puzzle) — prevents replay farming.
  const bestPerPuzzle = new Map<string, Row>();

  for (const row of (data as unknown as SupabaseRowGlobal[]).map(unwrapPlayersGlobal)) {
    const key = `${row.player_id}::${row.puzzle_id}`;
    const existing = bestPerPuzzle.get(key);
    if (!existing || row.final_score > existing.final_score) {
      bestPerPuzzle.set(key, row);
    }
  }

  // Step 2: sum best scores per player.
  type PlayerTotals = {
    player_id: string;
    name: string;
    branch: string;
    total_score: number;
    puzzles_completed: number;
  };

  const playerMap = new Map<string, PlayerTotals>();

  for (const row of bestPerPuzzle.values()) {
    const existing = playerMap.get(row.player_id);
    if (!existing) {
      playerMap.set(row.player_id, {
        player_id: row.player_id,
        name: row.players.name,
        branch: row.players.branch,
        total_score: row.final_score,
        puzzles_completed: 1,
      });
    } else {
      existing.total_score += row.final_score;
      existing.puzzles_completed += 1;
    }
  }

  let players = Array.from(playerMap.values());

  if (branch) players = players.filter((p) => p.branch === branch);

  // Sort: total DESC, puzzles_completed DESC as secondary tie-break
  // (per-puzzle time tie-breaking is not meaningful at global scope).
  players.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    return b.puzzles_completed - a.puzzles_completed;
  });

  return players.slice(0, limit).map((p, i) => ({
    rank: i + 1,
    player_name: p.name,
    branch: p.branch,
    total_score: p.total_score,
    puzzles_completed: p.puzzles_completed,
  }));
}