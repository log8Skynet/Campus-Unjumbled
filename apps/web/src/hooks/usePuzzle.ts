import { useCallback, useMemo, useState } from "react";
import { createPieces, shufflePieces, isSolved } from "../lib/puzzle";

interface PuzzleState {
  /** Length n². slots[0] is the locked anchor (value 0). null = empty slot. */
  slots: (number | null)[];
  /** Piece values not yet on the grid, in display order. */
  tray: number[];
  moveCount: number;
}

function initState(n: number): PuzzleState {
  const slots: (number | null)[] = Array(n * n).fill(null);
  slots[0] = 0; // anchor is pre-placed
  const tray = shufflePieces(createPieces(n)).slice(1); // drop the anchor
  return { slots, tray, moveCount: 0 };
}

/**
 * Drag-and-drop puzzle state.
 * Create a fresh game by remounting with a new `key` (e.g. the puzzle id),
 * or call `reset()` to reshuffle the same grid size.
 */
export function usePuzzle(n: number) {
  const [state, setState] = useState<PuzzleState>(() => initState(n));

  /**
   * Put `pieceValue` into `slotIndex`. The piece may come from the tray or from
   * another slot. If the target slot is occupied the two swap (tray source:
   * the displaced piece goes back to the tray). Counts as one move.
   */
  const placePiece = useCallback((slotIndex: number, pieceValue: number) => {
    setState((prev) => {
      const total = prev.slots.length;
      if (slotIndex <= 0 || slotIndex >= total) return prev; // anchor / out of range
      if (pieceValue <= 0 || pieceValue >= total) return prev; // anchor can't move
      if (prev.slots[slotIndex] === pieceValue) return prev; // dropped where it already is

      const slots = [...prev.slots];
      const tray = [...prev.tray];
      const fromSlot = slots.indexOf(pieceValue);
      const fromTray = tray.indexOf(pieceValue);
      if (fromSlot === -1 && fromTray === -1) return prev;

      const displaced = slots[slotIndex];
      slots[slotIndex] = pieceValue;

      if (fromSlot !== -1) {
        slots[fromSlot] = displaced; // swap (becomes empty if target was empty)
      } else if (displaced !== null) {
        tray[fromTray] = displaced; // displaced piece takes the dragged piece's tray spot
      } else {
        tray.splice(fromTray, 1);
      }

      return { slots, tray, moveCount: prev.moveCount + 1 };
    });
  }, []);

  /** Send a placed piece back to the tray. Not counted as a move. */
  const returnPiece = useCallback((slotIndex: number) => {
    setState((prev) => {
      if (slotIndex <= 0 || slotIndex >= prev.slots.length) return prev;
      const value = prev.slots[slotIndex];
      if (value === null) return prev;
      const slots = [...prev.slots];
      slots[slotIndex] = null;
      return { ...prev, slots, tray: [...prev.tray, value] };
    });
  }, []);

  const reset = useCallback(() => setState(initState(n)), [n]);

  const solved = useMemo(() => isSolved(state.slots, n), [state.slots, n]);

  return {
    slots: state.slots,
    tray: state.tray,
    moveCount: state.moveCount,
    solved,
    placePiece,
    returnPiece,
    reset,
  };
}
