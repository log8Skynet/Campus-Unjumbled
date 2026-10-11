import { describe, it, expect } from "vitest";
import { speedTier, baseScore, finalScore } from "./scoring";

const puzzle = { ace_time_ms: 30_000, par_time_ms: 90_000, max_score: 1000 } as any;

describe("speedTier", () => {
  it("ace when under ace_time",    () => expect(speedTier(25_000, puzzle)).toBe("ace"));
  it("par between ace and par",    () => expect(speedTier(60_000, puzzle)).toBe("par"));
  it("double_par between par–2x", () => expect(speedTier(150_000, puzzle)).toBe("double_par"));
  it("slow when over 2x par",      () => expect(speedTier(200_000, puzzle)).toBe("slow"));
});

describe("baseScore", () => {
  it("1000 for ace",         () => expect(baseScore(25_000, puzzle)).toBe(1000));
  it("750 for par",          () => expect(baseScore(60_000, puzzle)).toBe(750));
  it("500 for double_par",   () => expect(baseScore(150_000, puzzle)).toBe(500));
  it("250 for slow",         () => expect(baseScore(200_000, puzzle)).toBe(250));
});

describe("finalScore", () => {
  it("base on reject",       () => expect(finalScore(750, "rejected", false)).toBe(750));
  it("doubles on correct",   () => expect(finalScore(750, "accepted", true)).toBe(1500));
  it("0 on wrong",           () => expect(finalScore(750, "accepted", false)).toBe(0));
});