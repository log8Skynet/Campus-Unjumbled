import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import PuzzleBoard from "../components/PuzzleBoard";
import { useTimer } from "../hooks/useTimer";
import { endAttempt, errorMessage, getPuzzle, startAttempt } from "../api/client";
import { getStoredPlayer } from "../lib/session";
import { GRID_SIZE, type GambleState, type PuzzleSummary } from "../lib/types";

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("The puzzle image failed to load."));
    img.src = url;
  });
}

export default function Game() {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const navigate = useNavigate();
  const player = getStoredPlayer();
  const timer = useTimer();

  const [puzzle, setPuzzle] = useState<PuzzleSummary | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startedFor = useRef<string | null>(null); // guards React StrictMode's double effect
  const finalMoves = useRef(0);

  const begin = useCallback(async () => {
    if (!puzzleId || !player) return;
    setLoadError(null);
    try {
      const p = await getPuzzle(puzzleId);
      // Load the image first so the clock doesn't run while it downloads.
      await preloadImage(p.image_url);
      const { attempt_id } = await startAttempt(player.id, p.id);
      setPuzzle(p);
      setAttemptId(attempt_id);
      timer.start();
    } catch (err) {
      setLoadError(errorMessage(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleId, player?.id, timer.start]);

  useEffect(() => {
    if (startedFor.current === puzzleId) return;
    startedFor.current = puzzleId ?? null;
    begin();
  }, [puzzleId, begin]);

  const submitEnd = useCallback(
    async (moveCount: number, id: string, p: PuzzleSummary) => {
      setSubmitError(null);
      try {
        const result = await endAttempt(id, moveCount);
        const state: GambleState = {
          attemptId: id,
          puzzleId: p.id,
          imageUrl: p.image_url,
          baseScore: result.base_score,
          speedTier: result.speed_tier,
          durationMs: result.duration_ms,
          moveCount,
        };
        navigate("/gamble", { replace: true, state });
      } catch (err) {
        setSubmitError(errorMessage(err));
      }
    },
    [navigate]
  );

  const handleSolve = (moveCount: number) => {
    if (!attemptId || !puzzle) return;
    timer.stop(); // display only; the server measures the real time
    finalMoves.current = moveCount;
    setSolved(true);
    submitEnd(moveCount, attemptId, puzzle);
  };

  if (!player) return <Navigate to="/register" replace />;

  if (loadError) {
    return (
      <div role="alert" className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300">
        <p>{loadError}</p>
        <div className="mt-3 flex gap-4 text-sm font-semibold">
          <button onClick={begin} className="underline">
            Try again
          </button>
          <Link to="/puzzles" className="underline">
            Back to puzzles
          </Link>
        </div>
      </div>
    );
  }

  if (!puzzle || !attemptId) return <p className="text-stone-500">Getting your puzzle ready…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/puzzles" className="text-sm text-stone-600 underline dark:text-stone-400">
          Leave puzzle
        </Link>
        <span className="font-mono text-2xl font-semibold tabular-nums" aria-label="Elapsed time">
          {timer.formatted}
        </span>
      </div>

      <PuzzleBoard
        key={puzzle.id}
        imageUrl={puzzle.image_url}
        n={puzzle.grid_size ?? GRID_SIZE[puzzle.difficulty]}
        onSolve={handleSolve}
      />

      {solved && !submitError && (
        <p className="mt-4 text-center font-medium text-emerald-700 dark:text-emerald-400" aria-live="polite">
          Solved! Recording your time…
        </p>
      )}

      {submitError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <p>{submitError}</p>
          <button
            onClick={() => submitEnd(finalMoves.current, attemptId, puzzle)}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
