import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import PuzzleList from "./pages/PuzzleList";
import Game from "./pages/Game";
import DoubleOrNothing from "./pages/DoubleOrNothing";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";
import { clearPlayer, getStoredPlayer } from "./lib/session";

/** Players without a stored profile are sent to /register. */
function RequireAuth() {
  return getStoredPlayer() ? <Outlet /> : <Navigate to="/register" replace />;
}

function Layout() {
  useLocation(); // re-render the header after navigation (player may have changed)
  const navigate = useNavigate();
  const player = getStoredPlayer();

  const switchPlayer = () => {
    clearPlayer();
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/puzzles" className="text-lg font-bold tracking-tight">
            Campus Unjumbled
          </Link>
          {player && (
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/puzzles" className="hover:underline">
                Puzzles
              </Link>
              <Link to="/leaderboard" className="hover:underline">
                Leaderboard
              </Link>
            </nav>
          )}
          {player && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-stone-600 dark:text-stone-400">
                {player.name} ({player.branch})
              </span>
              <button onClick={switchPlayer} className="underline">
                Switch player
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  // If src/main.tsx already wraps <App /> in <BrowserRouter>, remove it here.
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route path="/puzzles" element={<PuzzleList />} />
            <Route path="/game/:puzzleId" element={<Game />} />
            <Route path="/gamble" element={<DoubleOrNothing />} />
            <Route path="/results" element={<Results />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* Task 3.2 adds /stats, Task 3.3 /admin */}
          </Route>
          <Route path="*" element={<Navigate to="/puzzles" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
