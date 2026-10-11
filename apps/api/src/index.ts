import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { playersRouter } from "./routes/players";
import { puzzlesRouter } from "./routes/puzzles";
import { attemptsRouter } from "./routes/attempts";
import { leaderboardRouter } from "./routes/leaderboard";

// Validates env vars at startup
import "./db/supabase";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/players", playersRouter);
app.use("/api/puzzles", puzzlesRouter);
app.use("/api/attempts", attemptsRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});