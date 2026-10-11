import { useEffect, useState } from "react";

/**
 * Tile edge length in px: min((viewport - padding - gaps) / n, maxTile).
 * Keeps a 3x3 board inside a 320px viewport and caps tiles at 120px on desktop.
 */
export function useTileSize(n: number, maxTile = 120, gap = 2, sidePadding = 32): number {
  const compute = () => {
    const width = typeof window === "undefined" ? 375 : window.innerWidth;
    return Math.max(40, Math.floor(Math.min((width - sidePadding - gap * (n - 1)) / n, maxTile)));
  };

  const [size, setSize] = useState(compute);

  useEffect(() => {
    const onResize = () => setSize(compute());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, maxTile, gap, sidePadding]);

  return size;
}
