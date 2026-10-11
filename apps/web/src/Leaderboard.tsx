import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  errorMessage,
  getGlobalLeaderboard,
  getPuzzleLeaderboard,
  listPuzzles,
} from "../api/client";
import { formatDuration } from "../lib/format";
import { getStoredPlayer } from "../lib/session";
import { BRANCHES, type Branch, type LeaderboardRow, type PuzzleSummary } from "../lib/types";

type Tab = "puzzle" | "global";

export default function Leaderboard() {
  const [params, setParams] = useSearchParams();
  const player = getStoredPlayer();

  const puzzleId = params.get("puzzle");
  const requestedTab = params.get("tab");
  const tab: Tab =
    requestedTab === "puzzle" || requestedTab === "global"
      ? requestedTab
      : puzzleId
        ? "puzzle"
        : "global";
  const branchParam = params.get("branch");
  const branch: Branch | "" = BRANCHES.includes(branchParam as Branch) ? (branchParam as Branch) : "";

  const [puzzles, setPuzzles] = useState<PuzzleSummary[] | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  // Puzzle list for the "This puzzle" dropdown.
  useEffect(() => {
    if (tab !== "puzzle" || puzzles) return;
    listPuzzles()
      .then(setPuzzles)
      .catch((err) => setError(errorMessage(err)));
  }, [tab, puzzles]);

  // Default to the first puzzle when none is chosen.
  useEffect(() => {
    if (tab === "puzzle" && !puzzleId && puzzles && puzzles.length > 0) {
      setParam("puzzle", puzzles[0].id);
    }
  }, [tab, puzzleId, puzzles, setParam]);

  const load = useCallback(async () => {
    if (tab === "puzzle" && !puzzleId) return;
    setRows(null);
    setError(null);
    try {
      setRows(
        tab === "puzzle" ? await getPuzzleLeaderboard(puzzleId as string, branch) : await getGlobalLeaderboard(branch)
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [tab, puzzleId, branch]);

  useEffect(() => {
    load();
  }, [load]);

  const isMe = (row: LeaderboardRow) =>
    Boolean(player) &&
    (row.player_id
      ? row.player_id === player?.id
      : row.player_name === player?.name && row.branch === player?.branch);

  const showRunStats = tab === "puzzle";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Leaderboard type" className="flex gap-2">
          {(
            [
              ["puzzle", "This puzzle"],
              ["global", "Global"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setParam("tab", id)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                tab === id
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "puzzle" && puzzles && puzzles.length > 0 && (
          <select
            aria-label="Puzzle"
            value={puzzleId ?? ""}
            onChange={(e) => setParam("puzzle", e.target.value)}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
          >
            {puzzles.map((p, i) => (
              <option key={p.id} value={p.id}>
                Puzzle {i + 1} ({p.difficulty})
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Filter by branch"
          value={branch}
          onChange={(e) => setParam("branch", e.target.value || null)}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
        >
          <option value="">All branches</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <p>{error}</p>
          <button onClick={load} className="mt-2 font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {!error && rows === null && <p className="mt-6 text-stone-500">Loading rankings…</p>}

      {rows && rows.length === 0 && (
        <p className="mt-6 text-stone-500">
          No scores yet{branch ? ` for ${branch}` : ""}. Finish a puzzle to take the first spot.
        </p>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-stone-300 dark:border-stone-700">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Rank</th>
                <th scope="col" className="px-3 py-2 font-medium">Player</th>
                <th scope="col" className="px-3 py-2 font-medium">Branch</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Score</th>
                {showRunStats && <th scope="col" className="px-3 py-2 text-right font-medium">Time</th>}
                {showRunStats && <th scope="col" className="px-3 py-2 text-right font-medium">Moves</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.rank}-${row.player_id ?? row.player_name}-${row.branch}`}
                  aria-current={isMe(row) ? "true" : undefined}
                  className={[
                    "border-t border-stone-200 dark:border-stone-800",
                    isMe(row) ? "bg-amber-100 font-semibold dark:bg-amber-950/40" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-2 tabular-nums">{row.rank}</td>
                  <td className="px-3 py-2">
                    {row.player_name}
                    {isMe(row) && <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">you</span>}
                  </td>
                  <td className="px-3 py-2">{row.branch}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.score}</td>
                  {showRunStats && (
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.duration_ms != null ? formatDuration(row.duration_ms) : "–"}
                    </td>
                  )}
                  {showRunStats && (
                    <td className="px-3 py-2 text-right tabular-nums">{row.move_count ?? "–"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
