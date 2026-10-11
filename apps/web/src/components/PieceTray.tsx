import type { DragEvent } from "react";
import PuzzlePiece from "./PuzzlePiece";
import type { DropTarget } from "../lib/puzzle";

interface PieceTrayProps {
  pieces: number[];
  n: number;
  imageUrl: string;
  tileSize: number;
  disabled?: boolean;
  highlighted?: boolean;
  /** A piece was dropped on the tray (HTML5 DnD path). */
  onDropToTray: (pieceValue: number) => void;
  onHoverChange: (target: DropTarget | null) => void;
  onPieceDrop: (pieceValue: number, target: DropTarget | null) => void;
}

export default function PieceTray({
  pieces,
  n,
  imageUrl,
  tileSize,
  disabled = false,
  highlighted = false,
  onDropToTray,
  onHoverChange,
  onPieceDrop,
}: PieceTrayProps) {
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault(); // marks the tray as a valid drop zone
    e.dataTransfer.dropEffect = "move";
    onHoverChange({ type: "tray" });
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onHoverChange(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onHoverChange(null);
    const value = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isInteger(value)) onDropToTray(value);
  };

  return (
    <div
      data-tray="true"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Piece tray"
      className={[
        "flex min-h-[5rem] w-full flex-wrap items-center justify-center gap-2 rounded-lg border p-3 transition-colors",
        highlighted
          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
          : "border-stone-300 bg-stone-100 dark:border-stone-700 dark:bg-stone-900",
      ].join(" ")}
    >
      {pieces.length === 0 ? (
        <p className="text-sm text-stone-500">All pieces are on the board.</p>
      ) : (
        pieces.map((value) => (
          <PuzzlePiece
            key={value}
            pieceValue={value}
            n={n}
            imageUrl={imageUrl}
            tileSize={tileSize}
            disabled={disabled}
            onPieceDrop={onPieceDrop}
            onPieceHover={onHoverChange}
          />
        ))
      )}
    </div>
  );
}
