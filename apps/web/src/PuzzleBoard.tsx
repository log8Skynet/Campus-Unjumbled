import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import PuzzlePiece from "./PuzzlePiece";
import PieceTray from "./PieceTray";
import { usePuzzle } from "../hooks/usePuzzle";
import { useTileSize } from "../hooks/useTileSize";
import { calcBackgroundPosition, type DropTarget } from "../lib/puzzle";
import { sameTarget } from "../lib/dropTarget";

interface PuzzleBoardProps {
  imageUrl: string;
  /** Grid size: 3 (easy), 4 (medium) or 5 (hard). */
  n: number;
  /** Fires once, when every non-anchor slot holds its correct piece. */
  onSolve: (moveCount: number) => void;
  /** Fires after every placement (corrections included). */
  onMoveUpdate?: (moveCount: number) => void;
  maxTile?: number;
}

const GAP = 2;

/**
 * Remount with a new `key` (e.g. the puzzle id) to start a different puzzle.
 */
export default function PuzzleBoard({
  imageUrl,
  n,
  onSolve,
  onMoveUpdate,
  maxTile = 120,
}: PuzzleBoardProps) {
  const { slots, tray, moveCount, solved, placePiece, returnPiece } = usePuzzle(n);
  const tileSize = useTileSize(n, maxTile, GAP);
  const [hover, setHover] = useState<DropTarget | null>(null);

  // Keep the latest callbacks without re-triggering the effects below.
  const onSolveRef = useRef(onSolve);
  const onMoveUpdateRef = useRef(onMoveUpdate);
  onSolveRef.current = onSolve;
  onMoveUpdateRef.current = onMoveUpdate;

  useEffect(() => {
    if (moveCount > 0) onMoveUpdateRef.current?.(moveCount);
  }, [moveCount]);

  const solvedFired = useRef(false);
  useEffect(() => {
    if (solved && !solvedFired.current) {
      solvedFired.current = true;
      onSolveRef.current(moveCount);
    }
  }, [solved, moveCount]);

  const updateHover = useCallback((target: DropTarget | null) => {
    setHover((prev) => (sameTarget(prev, target) ? prev : target));
  }, []);

  /**
   * One place that decides what a finished drag means (mouse and touch).
   * Slot -> place/swap. Tray or outside any zone -> back to the tray.
   */
  const handleDrop = useCallback(
    (pieceValue: number, target: DropTarget | null) => {
      setHover(null);
      if (target?.type === "slot") {
        placePiece(target.index, pieceValue);
        return;
      }
      const from = slots.indexOf(pieceValue);
      if (from > 0) returnPiece(from);
    },
    [placePiece, returnPiece, slots]
  );

  const handleSlotDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (solved || index === 0) return; // anchor slot refuses drops
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    updateHover({ type: "slot", index });
  };

  const handleSlotDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) updateHover(null);
  };

  const handleSlotDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const value = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isInteger(value)) handleDrop(value, { type: "slot", index });
  };

  const placedCount = slots.filter((v, i) => i > 0 && v !== null).length;
  const totalToPlace = n * n - 1;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
      <div className="flex w-full items-baseline justify-between text-sm text-stone-600 dark:text-stone-400">
        <span aria-live="polite">
          Placed {placedCount} of {totalToPlace}
        </span>
        <span>Moves: {moveCount}</span>
      </div>

      {/* Target grid. Slot 0 is the locked anchor. */}
      <div
        role="group"
        aria-label="Puzzle grid"
        className={[
          "grid rounded-md p-0.5",
          solved ? "ring-2 ring-emerald-500" : "",
        ].join(" ")}
        style={{
          gridTemplateColumns: `repeat(${n}, ${tileSize}px)`,
          gap: GAP,
        }}
      >
        {slots.map((value, i) => {
          const isHover = hover?.type === "slot" && hover.index === i;
          const ghost = calcBackgroundPosition(i, n, tileSize);

          return (
            <div
              key={i}
              data-slot-index={i}
              onDragOver={(e) => handleSlotDragOver(e, i)}
              onDragLeave={handleSlotDragLeave}
              onDrop={(e) => handleSlotDrop(e, i)}
              style={{ width: tileSize, height: tileSize }}
              className={[
                "relative rounded-sm transition-colors",
                value === null
                  ? isHover
                    ? "border-2 border-dashed border-amber-500 bg-amber-100 dark:bg-amber-950/40"
                    : "border border-dashed border-stone-400 bg-stone-100 dark:border-stone-600 dark:bg-stone-900"
                  : "",
              ].join(" ")}
            >
              {value === null ? (
                // Faint positional hint: the slot's own part of the photo at 8% opacity.
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: `url("${imageUrl}")`,
                    backgroundSize: `${n * tileSize}px ${n * tileSize}px`,
                    backgroundPosition: `${ghost.x}px ${ghost.y}px`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
              ) : (
                <PuzzlePiece
                  pieceValue={value}
                  n={n}
                  imageUrl={imageUrl}
                  tileSize={tileSize}
                  isAnchor={i === 0}
                  disabled={solved}
                  onPieceDrop={handleDrop}
                  onPieceHover={updateHover}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Scrambled pieces */}
      <PieceTray
        pieces={tray}
        n={n}
        imageUrl={imageUrl}
        tileSize={tileSize}
        disabled={solved}
        highlighted={hover?.type === "tray"}
        onDropToTray={(value) => handleDrop(value, { type: "tray" })}
        onHoverChange={updateHover}
        onPieceDrop={handleDrop}
      />
    </div>
  );
}
