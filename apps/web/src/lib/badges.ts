/** Badge catalogue (mirrors the seed in supabase/migrations/001_initial.sql). */
export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Record<string, BadgeInfo> = {
  first_solve: { id: "first_solve", name: "First Solve", description: "Completed your first puzzle", icon: "🎯" },
  speedster: { id: "speedster", name: "Speedster", description: "Solved any puzzle under its ace time", icon: "⚡" },
  campus_native: { id: "campus_native", name: "Campus Native", description: "Solved and correctly named a location at par or ace", icon: "🏛️" },
  risk_taker: { id: "risk_taker", name: "Risk Taker", description: "Won 3 double-or-nothing gambles", icon: "🎲" },
  record_holder: { id: "record_holder", name: "Record Holder", description: "Holds the fastest time on any puzzle", icon: "🥇" },
  campus_explorer: { id: "campus_explorer", name: "Campus Explorer", description: "Completed every published puzzle", icon: "🗺️" },
  branch_champion: { id: "branch_champion", name: "Branch Champion", description: "Your branch tops the global branch ranking", icon: "🏆" },
};
