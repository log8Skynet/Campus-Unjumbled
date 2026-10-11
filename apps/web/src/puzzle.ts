/**
 * Puzzle engine: pure functions, no React, no DOM.
 *
 * Piece values are flat indices 0..n²-1 in reading order (row by row).
 * Piece 0 is the top-left tile: it is the anchor, pre-placed and locked.
 * A slot is "correct" when slots[i] === i.
 */

export interface GridPosition {
  row: number;
  col: number;
}

export type DropTarget = { type: "slot"; index: number } | { type: "tray" };

/** [0, 1, 2, ... n²-1]. Index 0 is the anchor. */
export function createPieces(n: number): number[] {
  return Array.from({ length: n * n }, (_, i) => i);
}

/**
 * Fisher-Yates shuffle over indices 1..n²-1.
 * The anchor (index 0) is never moved. Returns a new array; input is untouched.
 * Re-shuffles in the (very unlikely) case the result equals the input.
 */
export function shufflePieces(pieces: number[]): number[] {
  const out = [...pieces];
  if (out.length < 3) return out; // nothing meaningful to shuffle

  do {
    for (let i = out.length - 1; i > 1; i--) {
      const j = 1 + Math.floor(Math.random() * i); // 1..i
      [out[i], out[j]] = [out[j], out[i]];
    }
  } while (out.every((v, i) => v === pieces[i]));

  return out;
}

/** Flat index -> grid row/col. */
export function getPiecePosition(index: number, n: number): GridPosition {
  return { row: Math.floor(index / n), col: index % n };
}

/** A piece belongs in the slot whose index equals its value. */
export function isCorrectPlacement(slotIndex: number, pieceValue: number): boolean {
  return slotIndex === pieceValue;
}

/**
 * Solved when every non-anchor slot (1..n²-1) holds its own piece.
 * `slots` has length n²; slot 0 is the anchor and is ignored here.
 */
export function isSolved(slots: (number | null)[], n: number): boolean {
  if (slots.length !== n * n) return false;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i] === null || !isCorrectPlacement(i, slots[i] as number)) return false;
  }
  return true;
}

/**
 * CSS background-position (px) that shows tile `pieceValue` of an image
 * rendered at (n * tileSize) x (n * tileSize).
 */
export function calcBackgroundPosition(
  pieceValue: number,
  n: number,
  tileSize: number
): { x: number; y: number } {
  const { row, col } = getPiecePosition(pieceValue, n);
  // `0 - x` rather than `-x` so the top row/left column give 0, not -0.
  return { x: 0 - col * tileSize, y: 0 - row * tileSize };
}
