import type { BadgeInfo } from "../lib/badges";
import "./BadgeCard.css";

interface BadgeCardProps {
  badge: BadgeInfo;
  /** Stagger several cards: delay in ms before this one pops in. */
  delayMs?: number;
}

/** A badge with its icon, name and description. Fades and scales in on mount. */
export default function BadgeCard({ badge, delayMs = 0 }: BadgeCardProps) {
  return (
    <li
      className="badge-card flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="text-3xl" aria-hidden>
        {badge.icon}
      </span>
      <span>
        <span className="block font-semibold">{badge.name}</span>
        <span className="block text-sm text-stone-600 dark:text-stone-400">{badge.description}</span>
      </span>
    </li>
  );
}
