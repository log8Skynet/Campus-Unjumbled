import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";
import { errorHandler } from "./middleware/errorHandler";

// Importing supabase here ensures env vars are validated at startup
import "./db/supabase";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});