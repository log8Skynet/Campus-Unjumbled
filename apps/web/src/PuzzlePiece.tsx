import { useRef, useState, type CSSProperties, type DragEvent, type PointerEvent } from "react";
import { calcBackgroundPosition, type DropTarget } from "../lib/puzzle";
import { resolveDropTarget } from "../lib/dropTarget";

interface PuzzlePieceProps {
  pieceValue: number;
  n: number;
  imageUrl: string;
  tileSize: number;
  /** The locked top-left tile: never draggable, gold border. */
  isAnchor?: boolean;
  /** Board is finished: pieces stop being draggable. */
  disabled?: boolean;
  /** Called when a drag ends. `target` is null when released outside any zone. */
  onPieceDrop?: (pieceValue: number, target: DropTarget | null) => void;
  /** Called while a touch drag moves over zones (for highlighting). */
  onPieceHover?: (target: DropTarget | null) => void;
}

const DRAG_THRESHOLD_PX = 6;

/**
 * Mouse  -> HTML5 Drag and Drop (draggable, dragstart, drop on slots/tray).
 * Touch / pen -> Pointer Events with pointer capture; the drop zone is found with
 * elementFromPoint, because native DnD is unreliable on mobile browsers.
 */
export default function PuzzlePiece({
  pieceValue,
  n,
  imageUrl,
  tileSize,
  isAnchor = false,
  disabled = false,
  onPieceDrop,
  onPieceHover,
}: PuzzlePieceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerKind = useRef<string>("mouse");
  const touchDrag = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null);
  const [lifted, setLifted] = useState(false);

  const locked = isAnchor || disabled;
  const { x, y } = calcBackgroundPosition(pieceValue, n, tileSize);

  const style: CSSProperties = {
    width: tileSize,
    height: tileSize,
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: `${n * tileSize}px ${n * tileSize}px`,
    backgroundPosition: `${x}px ${y}px`,
    backgroundRepeat: "no-repeat",
    touchAction: locked ? undefined : "none", // let our pointer handlers own touch drags
  };

  /** What is under the finger, ignoring the piece being dragged. */
  const targetAt = (clientX: number, clientY: number): DropTarget | null => {
    const el = ref.current;
    if (!el) return null;
    const prev = el.style.pointerEvents;
    el.style.pointerEvents = "none";
    const hit = document.elementFromPoint(clientX, clientY);
    el.style.pointerEvents = prev;
    return resolveDropTarget(hit);
  };

  const resetVisual = () => {
    if (ref.current) ref.current.style.transform = "";
    setLifted(false);
    onPieceHover?.(null);
  };

  // ---- HTML5 DnD (mouse) ----
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (locked || pointerKind.current !== "mouse") {
      e.preventDefault(); // touch/pen use the pointer path below
      return;
    }
    e.dataTransfer.setData("text/plain", String(pieceValue));
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => setLifted(true)); // after the drag image is captured
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setLifted(false);
    onPieceHover?.(null);
    // dropEffect "none" means nothing accepted the drop: send the piece home.
    if (e.dataTransfer.dropEffect === "none") onPieceDrop?.(pieceValue, null);
  };

  // ---- Pointer events (touch / pen) ----
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerKind.current = e.pointerType;
    if (locked || e.pointerType === "mouse") return;
    touchDrag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = touchDrag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      d.active = true;
      setLifted(true);
    }
    if (ref.current) ref.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
    onPieceHover?.(targetAt(e.clientX, e.clientY));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = touchDrag.current;
    if (!d || d.id !== e.pointerId) return;
    touchDrag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!d.active) return;
    const target = targetAt(e.clientX, e.clientY);
    resetVisual();
    onPieceDrop?.(pieceValue, target);
  };

  const handlePointerCancel = () => {
    touchDrag.current = null;
    resetVisual();
  };

  return (
    <div
      ref={ref}
      style={style}
      role="img"
      aria-label={isAnchor ? "Anchor piece, fixed in place" : `Puzzle piece ${pieceValue}`}
      draggable={!locked}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={[
        "select-none rounded-sm shadow-sm",
        isAnchor
          ? "pointer-events-none ring-2 ring-inset ring-amber-500"
          : locked
            ? ""
            : "cursor-grab active:cursor-grabbing",
        lifted ? "relative z-50 opacity-70 shadow-lg" : "",
      ].join(" ")}
    />
  );
}
