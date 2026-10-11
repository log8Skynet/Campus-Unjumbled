import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { errorMessage, submitGamble } from "../api/client";
import { formatDuration, TIER_LABELS } from "../lib/format";
import type { GambleState, ResultsState } from "../lib/types";

export default function DoubleOrNothing() {
  const navigate = useNavigate();
  const state = useLocation().state as GambleState | null;

  const [accepting, setAccepting] = useState(false);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refreshing this page loses the router state: send the player back to the list.
  if (!state) return <Navigate to="/puzzles" replace />;

  const submit = async (choice: "accepted" | "rejected") => {
    if (choice === "accepted" && answer.trim().length === 0) {
      setError("Type the name of the place first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await submitGamble(state.attemptId, choice, answer.trim());
      const next: ResultsState = {
        ...state,
        gambleChoice: choice,
        finalScore: result.final_score,
        answerCorrect: result.answer_correct,
        locationName: result.location_name,
      };
      navigate("/results", { replace: true, state: next });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const onAnswerSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit("accepted");
  };

  return (
    <div className="mx-auto max-w-md text-center">
      <img
        src={state.imageUrl}
        alt="The puzzle you just solved"
        className="mx-auto aspect-square w-full max-w-xs rounded-lg object-cover shadow"
      />

      <h1 className="mt-6 text-2xl font-bold tracking-tight">Double or nothing?</h1>
      <p className="mt-1 text-stone-600 dark:text-stone-400">
        You solved it in {formatDuration(state.durationMs)} with {state.moveCount} moves ({TIER_LABELS[state.speedTier]}).
      </p>
      <p className="mt-4 text-4xl font-bold tabular-nums">{state.baseScore}</p>
      <p className="text-sm text-stone-500">points banked</p>

      <p className="mt-5 text-sm">
        Name this place correctly to double your score to <strong>{state.baseScore * 2}</strong>. Get it wrong and you
        score <strong>0</strong>.
      </p>

      {!accepting ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => submit("rejected")}
            disabled={busy}
            className="rounded-md border border-stone-300 px-4 py-2.5 font-semibold hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            Keep {state.baseScore}
          </button>
          <button
            onClick={() => setAccepting(true)}
            disabled={busy}
            className="rounded-md bg-amber-500 px-4 py-2.5 font-semibold text-stone-900 hover:bg-amber-400 disabled:opacity-60"
          >
            Take the risk
          </button>
        </div>
      ) : (
        <form onSubmit={onAnswerSubmit} className="mt-6 space-y-3 text-left" noValidate>
          <label htmlFor="answer" className="block text-sm font-medium">
            What is this place?
          </label>
          <input
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
            autoComplete="off"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-stone-700 dark:bg-stone-900"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => submit("rejected")}
              disabled={busy}
              className="rounded-md border border-stone-300 px-4 py-2.5 font-semibold hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              Keep {state.baseScore} instead
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-amber-500 px-4 py-2.5 font-semibold text-stone-900 hover:bg-amber-400 disabled:opacity-60"
            >
              {busy ? "Checking…" : "Submit answer"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
