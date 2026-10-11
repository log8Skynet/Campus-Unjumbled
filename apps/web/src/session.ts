import type { StoredPlayer } from "./types";

const PLAYER_KEY = "cu_player";
const DEVICE_KEY = "cu_device_token";

export function getStoredPlayer(): StoredPlayer | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    return raw ? (JSON.parse(raw) as StoredPlayer) : null;
  } catch {
    return null;
  }
}

export function storePlayer(player: StoredPlayer): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

export function clearPlayer(): void {
  localStorage.removeItem(PLAYER_KEY);
}

/**
 * 64-character hex token (the API requires length 64). Generated once per
 * browser and kept in localStorage, so registering again returns the same player.
 */
export function getDeviceToken(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing && existing.length === 64) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(DEVICE_KEY, token);
  return token;
}
