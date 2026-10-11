import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { getPlayerBadges } from "../api/client";
import { BADGES, type BadgeInfo } from "../lib/badges";
import { formatDuration, TIER_LABELS } from "../lib/format";
import { getStoredPlayer } from "../lib/session";
import type { ResultsState } from "../lib/types";

export default function Results() {
  const state = useLocation().state as ResultsState | null;
  const player = getStoredPlayer();
  const [newBadges, setNewBadges] = useState<BadgeInfo[]>([]);

  const attemptId = state?.attemptId;
  const playerId = player?.id;

  useEffect(() => {
    if (!attemptId || !playerId) return;
    let cancelled = false;
    getPlayerBadges(playerId)
      .then((rows) => {
        if (cancelled) return;
        setNewBadges(
          rows
            .filter((r) => r.attempt_id === attemptId)
            .map((r) => BADGES[r.badge_id])
            .filter((b): b is BadgeInfo => Boolean(b))
        );
      })
      .catch(() => {
        /* badges are a bonus: the results page works without them */
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId, playerId]);

  // Refreshing loses the router state: go back to the list instead of crashing.
  if (!state) return <Navigate to="/puzzles" replace />;

  let headline: string;
  let detail: string;
  if (state.gambleChoice === "rejected") {
    headline = "You kept your score";
    detail = `This place is ${state.locationName}.`;
  } else if (state.answerCorrect) {
    headline = "Correct, score doubled";
    detail = `Yes, it's ${state.locationName}.`;
  } else {
    headline = "Not quite, score lost";
    detail = `This place is ${state.locationName}.`;
  }

  const stats = [
    { label: "Time", value: formatDuration(state.durationMs) },
    { label: "Moves", value: String(state.moveCount) },
    { label: "Speed tier", value: TIER_LABELS[state.speedTier] },
    { label: "Base score", value: String(state.baseScore) },
  ];

  return (
    <div className="mx-auto max-w-md text-center">
      <img
        src={state.imageUrl}
        alt={state.locationName}
        className="mx-auto aspect-square w-full max-w-xs rounded-lg object-cover shadow"
      />

      <h1 className="mt-6 text-2xl font-bold tracking-tight">{headline}</h1>
      <p className="mt-1 text-stone-600 dark:text-stone-400">{detail}</p>

      <p className="mt-5 text-5xl font-bold tabular-nums">{state.finalScore}</p>
      <p className="text-sm text-stone-500">final score</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-stone-300 p-3 dark:border-stone-700">
            <dt className="text-sm text-stone-500">{s.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {newBadges.length > 0 && (
        <section className="mt-8 text-left" aria-label="New badges">
          <h2 className="text-lg font-semibold">New badges</h2>
          <ul className="mt-2 space-y-2">
            {newBadges.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
                <span className="text-2xl" aria-hidden>
                  {b.icon}
                </span>
                <span>
                  <span className="block font-semibold">{b.name}</span>
                  <span className="block text-sm text-stone-600 dark:text-stone-400">{b.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          to="/puzzles"
          className="rounded-md bg-amber-500 px-4 py-2.5 font-semibold text-stone-900 hover:bg-amber-400"
        >
          Play another
        </Link>
        <Link
          to="/leaderboard"
          className="rounded-md border border-stone-300 px-4 py-2.5 font-semibold hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          View leaderboard
        </Link>
      </div>
    </div>
  );
}
