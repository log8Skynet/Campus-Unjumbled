import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { startAttemptLimiter } from "../middleware/rateLimit";
import { startAttempt, endAttempt, submitGamble } from "../services/attempts";

export const attemptsRouter = Router();

const startSchema = z.object({
  player_id: z.string().uuid(),
  puzzle_id: z.string().uuid(),
});

const endSchema = z.object({
  attempt_id: z.string().uuid(),
  move_count: z.number().int().min(0),
});

const gambleSchema = z.object({
  attempt_id: z.string().uuid(),
  choice: z.enum(["accepted", "rejected"]),
  answer: z.string().optional(),
});

attemptsRouter.post(
  "/start",
  startAttemptLimiter,
  validate(startSchema),
  async (req, res, next) => {
    try {
      const result = await startAttempt(req.body.player_id, req.body.puzzle_id);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

attemptsRouter.post("/end", validate(endSchema), async (req, res, next) => {
  try {
    const result = await endAttempt(req.body.attempt_id, req.body.move_count);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

attemptsRouter.post("/gamble", validate(gambleSchema), async (req, res, next) => {
  try {
    const result = await submitGamble(
      req.body.attempt_id,
      req.body.choice,
      req.body.answer
    );
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});