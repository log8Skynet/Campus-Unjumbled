import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { registerPlayer, errorMessage } from "../api/client";
import { BRANCHES, type Branch } from "../lib/types";
import { getDeviceToken, getStoredPlayer, storePlayer } from "../lib/session";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [branch, setBranch] = useState<Branch | "">("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (getStoredPlayer()) return <Navigate to="/puzzles" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError("Enter a name with at least 2 characters.");
    if (!branch) return setError("Pick your branch.");

    setBusy(true);
    setError(null);
    try {
      const player = await registerPlayer(trimmed, branch, getDeviceToken());
      storePlayer({ id: player.id, name: player.name, branch: player.branch });
      navigate("/puzzles", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-6">
      <h1 className="text-3xl font-bold tracking-tight">Solve the puzzle, know the campus</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Rebuild scrambled photos of BIT Sindri as fast as you can, then name the place to double your score.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Your name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoComplete="nickname"
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-stone-700 dark:bg-stone-900"
          />
        </div>

        <div>
          <label htmlFor="branch" className="block text-sm font-medium">
            Branch
          </label>
          <select
            id="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value as Branch)}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-stone-700 dark:bg-stone-900"
          >
            <option value="" disabled>
              Select your branch
            </option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-amber-500 px-4 py-2.5 font-semibold text-stone-900 transition-colors hover:bg-amber-400 disabled:opacity-60"
        >
          {busy ? "Registering…" : "Start playing"}
        </button>
      </form>
    </div>
  );
}
