import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type PuzzleConfig = {
  id: string;
  location_name: string;
  location_aliases: string[];
  difficulty: string;
  ace_time_ms: number;
  par_time_ms: number;
  max_score: number;
  image_filename: string;
};

async function seed() {
  const configPath = path.join(__dirname, "../config/puzzles.json");
  const puzzles: PuzzleConfig[] = JSON.parse(fs.readFileSync(configPath, "utf8"));

  for (const puzzle of puzzles) {
    const imagePath = path.join(__dirname, "../config/images", puzzle.image_filename);
    const ext = path.extname(puzzle.image_filename).slice(1); // "jpg"
    const storagePath = `/${puzzle.id}.${ext}`;

    // Upload image (upsert = overwrite)
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const { error: uploadError } = await supabase.storage
        .from("puzzle-images")
        .upload(storagePath, imageBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) {
        console.error(`[${puzzle.id}] image upload failed:`, uploadError.message);
        continue;
      }
    } else {
      // shortcut: skips missing images silently; add placeholder check before Phase 4 launch
      console.warn(`[${puzzle.id}] image not found at ${imagePath}, skipping upload`);
    }

    // Upsert puzzle row (match on config_id)
    const { error: upsertError } = await supabase.from("puzzles").upsert(
      {
        config_id: puzzle.id,
        location_name: puzzle.location_name,
        location_aliases: puzzle.location_aliases,
        difficulty: puzzle.difficulty,
        ace_time_ms: puzzle.ace_time_ms,
        par_time_ms: puzzle.par_time_ms,
        max_score: puzzle.max_score,
        image_url: "",
        published: false,
      },
      { onConflict: "config_id" }
    );

    if (upsertError) {
      console.error(`[${puzzle.id}] db upsert failed:`, upsertError.message);
    } else {
      console.log(`[${puzzle.id}] ✓`);
    }
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});