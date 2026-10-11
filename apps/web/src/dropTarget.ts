import type { DropTarget } from "./puzzle";

/**
 * Walks up from an element to find which drop zone it is inside.
 * Slots carry `data-slot-index`, the tray carries `data-tray`.
 * Used by the pointer-events (touch) drag path, where there is no native drop event.
 */
export function resolveDropTarget(el: Element | null): DropTarget | null {
  if (!el) return null;

  const slot = el.closest("[data-slot-index]");
  if (slot) {
    const index = Number(slot.getAttribute("data-slot-index"));
    if (Number.isInteger(index)) return { type: "slot", index };
  }

  if (el.closest("[data-tray]")) return { type: "tray" };
  return null;
}

export function sameTarget(a: DropTarget | null, b: DropTarget | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.type !== b.type) return false;
  return a.type === "tray" || (a.type === "slot" && b.type === "slot" && a.index === b.index);
}
