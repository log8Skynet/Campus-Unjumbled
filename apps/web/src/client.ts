import type {
  Branch,
  Difficulty,
  EndAttemptResult,
  GambleResult,
  LeaderboardRow,
  PlayerBadgeRow,
  PuzzleSummary,
  StoredPlayer,
} from "../lib/types";

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 0
  ) {
    super(message);
  }
}

/** Human-readable message for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Too many requests. Wait a minute and try again.";
    return err.message;
  }
  return "Something went wrong. Try again.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Can't reach the server. Check your connection and try again.");
  }

  let body: { data?: T; error?: { code: string; message: string } } | null = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || body?.error || body?.data === undefined) {
    throw new ApiError(
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? `Request failed (${res.status}).`,
      res.status
    );
  }
  return body.data;
}

const post = <T>(path: string, payload: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(payload) });

// ---- Players ----
export const registerPlayer = (name: string, branch: Branch, deviceToken: string) =>
  post<StoredPlayer>("/players", { name, branch, device_token: deviceToken });

// ---- Puzzles ----
export const listPuzzles = (difficulty?: Difficulty) =>
  request<PuzzleSummary[]>(`/puzzles${difficulty ? `?difficulty=${difficulty}` : ""}`);

export const getPuzzle = (id: string) => request<PuzzleSummary>(`/puzzles/${id}`);

// ---- Attempts ----
export const startAttempt = (playerId: string, puzzleId: string) =>
  post<{ attempt_id: string }>("/attempts/start", { player_id: playerId, puzzle_id: puzzleId });

export const endAttempt = (attemptId: string, moveCount: number) =>
  post<EndAttemptResult>("/attempts/end", { attempt_id: attemptId, move_count: moveCount });

export const submitGamble = (attemptId: string, choice: "accepted" | "rejected", answer?: string) =>
  post<GambleResult>("/attempts/gamble", {
    attempt_id: attemptId,
    choice,
    ...(choice === "accepted" ? { answer } : {}),
  });

// ---- Badges ----
export const getPlayerBadges = (playerId: string) =>
  request<PlayerBadgeRow[]>(`/badges/player/${playerId}`);

// ---- Leaderboards ----
const withParams = (path: string, branch?: Branch | "", limit = 50) => {
  const q = new URLSearchParams({ limit: String(limit) });
  if (branch) q.set("branch", branch);
  return `${path}?${q.toString()}`;
};

export const getPuzzleLeaderboard = (puzzleId: string, branch?: Branch | "") =>
  request<LeaderboardRow[]>(withParams(`/leaderboard/puzzle/${puzzleId}`, branch));

export const getGlobalLeaderboard = (branch?: Branch | "") =>
  request<LeaderboardRow[]>(withParams("/leaderboard/global", branch));
