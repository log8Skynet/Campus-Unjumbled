import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { registerPlayerLimiter } from "../middleware/rateLimit";
import { createPlayer } from "../services/players";

export const playersRouter = Router();

const ALL_BRANCHES = [
  "CSE", "ECE", "EE", "ME", "CE", "IT", "CH", "MME", "MCA", "MBA", "OTHER",
] as const;

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  branch: z.enum(ALL_BRANCHES),
  device_token: z.string().length(64),
});

playersRouter.post("/", registerPlayerLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const player = await createPlayer(req.body);
    res.status(201).json({ data: player });
  } catch (err) {
    next(err);
  }
});