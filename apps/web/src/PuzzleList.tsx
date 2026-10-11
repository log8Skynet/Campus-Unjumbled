import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPuzzles, errorMessage } from "../api/client";
import { GRID_SIZE, type Difficulty, type PuzzleSummary } from "../lib/types";

type Tab = "all" | Difficulty;
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

export default function PuzzleList() {
  const [tab, setTab] = useState<Tab>("all");
  const [puzzles, setPuzzles] = useState<PuzzleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPuzzles(null);
    setError(null);
    try {
      setPuzzles(await listPuzzles(tab === "all" ? undefined : tab));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Pick a puzzle</h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Photos stay hidden until you solve them. Harder puzzles have more pieces.
      </p>

      <div role="tablist" aria-label="Difficulty" className="mt-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <p>{error}</p>
          <button onClick={load} className="mt-2 font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {!error && puzzles === null && <p className="mt-6 text-stone-500">Loading puzzles…</p>}

      {puzzles && puzzles.length === 0 && (
        <p className="mt-6 text-stone-500">No puzzles here yet. Try another difficulty.</p>
      )}

      {puzzles && puzzles.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {puzzles.map((p, i) => {
            const n = p.grid_size ?? GRID_SIZE[p.difficulty];
            return (
              <li key={p.id}>
                <Link
                  to={`/game/${p.id}`}
                  className="flex h-full flex-col justify-between rounded-lg border border-stone-300 bg-white p-4 transition-colors hover:border-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 dark:border-stone-700 dark:bg-stone-900"
                >
                  <span className="text-lg font-semibold">Puzzle {i + 1}</span>
                  <span className="mt-4 flex items-center justify-between text-sm">
                    <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${DIFFICULTY_STYLE[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                    <span className="text-stone-500">
                      {n}×{n} grid
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
