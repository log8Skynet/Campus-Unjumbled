import { describe, it, expect } from "vitest";
import {
  createPieces,
  shufflePieces,
  getPiecePosition,
  isCorrectPlacement,
  isSolved,
  calcBackgroundPosition,
} from "./puzzle";

describe("createPieces", () => {
  it.each([3, 4, 5])("creates n² pieces in order for n=%i", (n) => {
    const pieces = createPieces(n);
    expect(pieces).toHaveLength(n * n);
    expect(pieces).toEqual(Array.from({ length: n * n }, (_, i) => i));
  });
});

describe("shufflePieces", () => {
  it.each([3, 4, 5])("never moves the anchor (n=%i)", (n) => {
    for (let run = 0; run < 200; run++) {
      expect(shufflePieces(createPieces(n))[0]).toBe(0);
    }
  });

  it.each([3, 4, 5])("returns a permutation of the input (n=%i)", (n) => {
    const input = createPieces(n);
    const out = shufflePieces(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the input", () => {
    const input = createPieces(3);
    const copy = [...input];
    shufflePieces(input);
    expect(input).toEqual(copy);
  });

  it("actually shuffles (differs from the solved order)", () => {
    const input = createPieces(4);
    expect(shufflePieces(input)).not.toEqual(input);
  });
});

describe("getPiecePosition", () => {
  it("maps flat index to row/col", () => {
    expect(getPiecePosition(0, 3)).toEqual({ row: 0, col: 0 });
    expect(getPiecePosition(2, 3)).toEqual({ row: 0, col: 2 });
    expect(getPiecePosition(3, 3)).toEqual({ row: 1, col: 0 });
    expect(getPiecePosition(8, 3)).toEqual({ row: 2, col: 2 });
    expect(getPiecePosition(7, 4)).toEqual({ row: 1, col: 3 });
  });
});

describe("isCorrectPlacement", () => {
  it("is true only when slot index equals piece value", () => {
    expect(isCorrectPlacement(4, 4)).toBe(true);
    expect(isCorrectPlacement(4, 5)).toBe(false);
    expect(isCorrectPlacement(0, 0)).toBe(true);
  });
});

describe("isSolved", () => {
  it("true when every slot holds its own piece", () => {
    expect(isSolved(createPieces(3), 3)).toBe(true);
    expect(isSolved(createPieces(5), 5)).toBe(true);
  });

  it("false when two pieces are swapped", () => {
    const slots: (number | null)[] = createPieces(3);
    [slots[1], slots[2]] = [slots[2], slots[1]];
    expect(isSolved(slots, 3)).toBe(false);
  });

  it("false when any non-anchor slot is empty", () => {
    const slots: (number | null)[] = createPieces(3);
    slots[8] = null;
    expect(isSolved(slots, 3)).toBe(false);
  });

  it("false for a freshly started board (only the anchor placed)", () => {
    const slots: (number | null)[] = Array(9).fill(null);
    slots[0] = 0;
    expect(isSolved(slots, 3)).toBe(false);
  });

  it("false when the slots array has the wrong length", () => {
    expect(isSolved(createPieces(3), 4)).toBe(false);
  });
});

describe("calcBackgroundPosition (3x3, tileSize 100)", () => {
  it("top-left tile is 0,0", () => {
    expect(calcBackgroundPosition(0, 3, 100)).toEqual({ x: 0, y: 0 });
  });
  it("shifts left by col and up by row", () => {
    expect(calcBackgroundPosition(1, 3, 100)).toEqual({ x: -100, y: 0 });
    expect(calcBackgroundPosition(3, 3, 100)).toEqual({ x: 0, y: -100 });
    expect(calcBackgroundPosition(4, 3, 100)).toEqual({ x: -100, y: -100 });
    expect(calcBackgroundPosition(8, 3, 100)).toEqual({ x: -200, y: -200 });
  });
  it("scales with tile size", () => {
    expect(calcBackgroundPosition(5, 3, 120)).toEqual({ x: -240, y: -120 });
  });
});
