import { Router } from "express";
import { z } from "zod";
import { getPuzzleLeaderboard, getGlobalLeaderboard } from "../services/leaderboard";

export const leaderboardRouter = Router();

const querySchema = z.object({
  branch: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

leaderboardRouter.get("/puzzle/:puzzleId", async (req, res, next) => {
  try {
    const result = querySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: result.error.errors[0].message },
      });
    }
    const rows = await getPuzzleLeaderboard(
      req.params.puzzleId,
      result.data.branch,
      result.data.limit
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

leaderboardRouter.get("/global", async (req, res, next) => {
  try {
    const result = querySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: result.error.errors[0].message },
      });
    }
    const rows = await getGlobalLeaderboard(
      result.data.branch,
      result.data.limit
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});