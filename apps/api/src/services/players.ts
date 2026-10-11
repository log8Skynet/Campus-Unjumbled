import { supabase } from "../db/supabase";
import { AppError } from "../errors";

export type Player = {
  id: string;
  name: string;
  branch: string;
  device_token: string;
  created_at: string;
};

export async function createPlayer(data: {
  name: string;
  branch: string;
  device_token: string;
}): Promise<Player> {
  // Try insert first
  const { data: inserted, error: insertError } = await supabase
    .from("players")
    .insert(data)
    .select()
    .single();

  if (!insertError) return inserted as Player;

  // Unique violation on device_token → return existing player
  if (insertError.code === "23505") {
    const { data: existing, error: fetchError } = await supabase
      .from("players")
      .select()
      .eq("device_token", data.device_token)
      .single();

    if (fetchError || !existing) {
      throw new AppError("DB_ERROR", 500, fetchError?.message ?? "Player not found after conflict");
    }

    return existing as Player;
  }

  throw new AppError("DB_ERROR", 500, insertError.message);
}