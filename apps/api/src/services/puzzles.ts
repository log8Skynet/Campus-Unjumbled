import { supabase } from "../db/supabase";
import { AppError } from "../errors";

type Difficulty = "easy" | "medium" | "hard";

const GRID_SIZE: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

type PuzzleRow = {
  id: string;
  config_id: string;
  image_url: string;
  difficulty: Difficulty;
  location_name: string;
  location_aliases: string[];
  ace_time_ms: number;
  par_time_ms: number;
  max_score: number;
  published: boolean;
  created_at: string;
};

type PuzzleResponse = Omit<PuzzleRow, "location_name" | "location_aliases"> & {
  grid_size: number;
};

function toResponse(row: PuzzleRow): PuzzleResponse {
  const { location_name, location_aliases, ...rest } = row;
  return { ...rest, grid_size: GRID_SIZE[row.difficulty] };
}

export async function listPuzzles(difficulty?: string): Promise<PuzzleResponse[]> {
  let query = supabase
    .from("puzzles")
    .select("*")
    .eq("published", true);

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  const { data, error } = await query;

  if (error) throw new AppError("DB_ERROR", 500, error.message);

  return (data as PuzzleRow[]).map(toResponse);
}

export async function getPuzzle(id: string): Promise<PuzzleResponse> {
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (error || !data) {
    throw new AppError("PUZZLE_NOT_FOUND", 404, "Puzzle not found");
  }

  return toResponse(data as PuzzleRow);
}