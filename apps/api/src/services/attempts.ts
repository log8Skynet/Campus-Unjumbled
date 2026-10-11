import { supabase } from "../db/supabase";
import { AppError } from "../errors";

// ---------------------------------------------------------------------------
// Scoring helpers — spec-compliant step tiers.
// TODO: replace with `import { speedTier, baseScore, finalScore }
//       from "@campus-unjumbled/shared"` once the shared package is wired up.
// ---------------------------------------------------------------------------

type SpeedTier = "ace" | "par" | "double_par" | "slow";

function speedTier(
  durationMs: number,
  aceTimeMs: number,
  parTimeMs: number
): SpeedTier {
  if (durationMs <= aceTimeMs) return "ace";
  if (durationMs <= parTimeMs) return "par";
  if (durationMs <= parTimeMs * 2) return "double_par";
  return "slow";
}

function baseScore(
  maxScore: number,
  durationMs: number,
  aceTimeMs: number,
  parTimeMs: number
): number {
  const multipliers: Record<SpeedTier, number> = {
    ace: 1.0,
    par: 0.75,
    double_par: 0.5,
    slow: 0.25,
  };
  return Math.round(
    maxScore * multipliers[speedTier(durationMs, aceTimeMs, parTimeMs)]
  );
}

// ---------------------------------------------------------------------------
// Simple fuzzy answer matching: exact match OR one string contains the other,
// after lowercasing and trimming whitespace.
// ---------------------------------------------------------------------------

function isAnswerMatch(input: string, candidate: string): boolean {
  return candidate === input || candidate.includes(input) || input.includes(candidate);
}

// ---------------------------------------------------------------------------
// Badge evaluation stub — replaced in Task 2.3
// ---------------------------------------------------------------------------

async function evaluateBadges(
  _playerId: string,
  _attemptId: string
): Promise<string[]> {
  return [];
}

// ---------------------------------------------------------------------------
// startAttempt
// ---------------------------------------------------------------------------

export async function startAttempt(
  playerId: string,
  puzzleId: string
): Promise<{ attempt_id: string }> {
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .single();

  if (playerError || !player) {
    throw new AppError("PLAYER_NOT_FOUND", 404, "Player not found");
  }

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id")
    .eq("id", puzzleId)
    .eq("published", true)
    .single();

  if (puzzleError || !puzzle) {
    throw new AppError("PUZZLE_NOT_FOUND", 404, "Puzzle not found");
  }

  const { data: attempt, error: insertError } = await supabase
    .from("attempts")
    .insert({ player_id: playerId, puzzle_id: puzzleId })
    .select("id")
    .single();

  if (insertError || !attempt) {
    throw new AppError(
      "DB_ERROR",
      500,
      insertError?.message ?? "Failed to start attempt"
    );
  }

  return { attempt_id: attempt.id };
}

// ---------------------------------------------------------------------------
// endAttempt
// ---------------------------------------------------------------------------

export async function endAttempt(
  attemptId: string,
  moveCount: number
): Promise<{ base_score: number; speed_tier: SpeedTier; duration_ms: number }> {
  const { data: attempt, error: fetchError } = await supabase
    .from("attempts")
    .select(
      "id, start_ts, end_ts, player_id, puzzles(ace_time_ms, par_time_ms, max_score)"
    )
    .eq("id", attemptId)
    .single();

  if (fetchError || !attempt) {
    throw new AppError("ATTEMPT_NOT_FOUND", 404, "Attempt not found");
  }

  if (attempt.end_ts) {
    throw new AppError("ATTEMPT_ALREADY_ENDED", 409, "Attempt already ended");
  }

  const endTs = new Date();
  const durationMs = endTs.getTime() - new Date(attempt.start_ts).getTime();

  // Supabase types joined relations as T[] even on a many-to-one join.
  // Cast through unknown, then take index [0] to get the single object.
  const puzzleRaw = (attempt.puzzles as unknown as {
    ace_time_ms: number;
    par_time_ms: number;
    max_score: number;
  }[]);
  const puzzle = Array.isArray(puzzleRaw) ? puzzleRaw[0] : puzzleRaw;

  const tier = speedTier(durationMs, puzzle.ace_time_ms, puzzle.par_time_ms);
  const score = baseScore(
    puzzle.max_score,
    durationMs,
    puzzle.ace_time_ms,
    puzzle.par_time_ms
  );

  // Store base_score in final_score as a temporary value. submitGamble will
  // recompute the base cleanly from duration_ms + puzzle data and overwrite
  // final_score with the true post-gamble value.
  const { error: updateError } = await supabase
    .from("attempts")
    .update({
      end_ts: endTs.toISOString(),
      move_count: moveCount,
      speed_tier: tier,
      final_score: score, // provisional; overwritten by submitGamble
    })
    .eq("id", attemptId);

  if (updateError) {
    throw new AppError("DB_ERROR", 500, updateError.message);
  }

  // Badge evaluation runs again after gamble; calling it here covers the
  // first_solve badge which only needs a completed attempt.
  await evaluateBadges(attempt.player_id, attemptId);

  return { base_score: score, speed_tier: tier, duration_ms: durationMs };
}

// ---------------------------------------------------------------------------
// submitGamble
// ---------------------------------------------------------------------------

export async function submitGamble(
  attemptId: string,
  choice: "accepted" | "rejected",
  answer?: string
): Promise<{
  final_score: number;
  answer_correct: boolean | null;
  location_name: string;
}> {
  // Fetch start_ts so we can recompute base score from server-measured duration,
  // rather than trusting the provisional final_score written by endAttempt.
  // NOTE: keep the select string as a single literal (no concatenation) so
  // TypeScript can infer the shape rather than widening to GenericStringError.
  const { data: attempt, error: fetchError } = await supabase
    .from("attempts")
    .select(
      "id, start_ts, end_ts, gamble_choice, player_id, puzzles(location_name, location_aliases, ace_time_ms, par_time_ms, max_score)"
    )
    .eq("id", attemptId)
    .single();

  if (fetchError || !attempt) {
    throw new AppError("ATTEMPT_NOT_FOUND", 404, "Attempt not found");
  }

  // After the null-guard above, TypeScript still widens these to the union type
  // that includes GenericStringError. Assert the concrete shape we know we get.
  const safeAttempt = attempt as {
    id: string;
    start_ts: string;
    end_ts: string | null;
    gamble_choice: string | null;
    player_id: string;
    puzzles:
      | {
          location_name: string;
          location_aliases: string[];
          ace_time_ms: number;
          par_time_ms: number;
          max_score: number;
        }
      | {
          location_name: string;
          location_aliases: string[];
          ace_time_ms: number;
          par_time_ms: number;
          max_score: number;
        }[];
  };

  if (!safeAttempt.end_ts) {
    throw new AppError("ATTEMPT_NOT_ENDED", 400, "Attempt has not ended yet");
  }

  if (safeAttempt.gamble_choice !== null) {
    throw new AppError(
      "GAMBLE_ALREADY_SUBMITTED",
      409,
      "Gamble already submitted"
    );
  }

  // Supabase may return the joined relation as an array; unwrap if needed.
  const puzzleRaw = safeAttempt.puzzles;
  const puzzle = Array.isArray(puzzleRaw) ? puzzleRaw[0] : puzzleRaw;

  // Recompute base from server-measured timestamps — authoritative source.
  const durationMs =
    new Date(safeAttempt.end_ts).getTime() -
    new Date(safeAttempt.start_ts).getTime();
  const base = baseScore(
    puzzle.max_score,
    durationMs,
    puzzle.ace_time_ms,
    puzzle.par_time_ms
  );

  let finalScore: number;
  let answerCorrect: boolean | null = null;

  if (choice === "rejected") {
    finalScore = base;
  } else {
    const normalized = (answer ?? "").toLowerCase().trim();
    const candidates = [
      puzzle.location_name.toLowerCase(),
      ...(puzzle.location_aliases ?? []).map((a: string) => a.toLowerCase()),
    ];
    answerCorrect = candidates.some((c) => isAnswerMatch(normalized, c));
    finalScore = answerCorrect ? base * 2 : 0;
  }

  const { error: updateError } = await supabase
    .from("attempts")
    .update({
      gamble_choice: choice,
      answer_given: answer ?? null,
      answer_correct: answerCorrect,
      final_score: finalScore,
    })
    .eq("id", attemptId);

  if (updateError) {
    throw new AppError("DB_ERROR", 500, updateError.message);
  }

  await evaluateBadges(safeAttempt.player_id, attemptId);

  return {
    final_score: finalScore,
    answer_correct: answerCorrect,
    location_name: puzzle.location_name,
  };
}