import { Router } from "express";
import { z } from "zod";
import { listPuzzles, getPuzzle } from "../services/puzzles";

export const puzzlesRouter = Router();

const difficultyValues = ["easy", "medium", "hard"] as const;

const listQuerySchema = z.object({
  difficulty: z.enum(difficultyValues).optional(),
});

puzzlesRouter.get("/", async (req, res, next) => {
  try {
    const result = listQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: result.error.errors[0].message },
      });
    }
    const puzzles = await listPuzzles(result.data.difficulty);
    res.json({ data: puzzles });
  } catch (err) {
    next(err);
  }
});

puzzlesRouter.get("/:id", async (req, res, next) => {
  try {
    const puzzle = await getPuzzle(req.params.id);
    res.json({ data: puzzle });
  } catch (err) {
    next(err);
  }
});