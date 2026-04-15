"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildNameLookup } from "@/lib/screens";

/**
 * Dev-only overlay that shows the `screens.ts` constant path for any
 * UI element you right-click on. Only renders when NODE_ENV === "development".
 *
 * How it works:
 *  1. Right-click any element on the page.
 *  2. The inspector walks up the DOM from the click target, checking each
 *     element's trimmed text against a reverse lookup of every constant
 *     exported from `src/lib/screens.ts`.
 *  3. If a match is found, a small floating badge appears showing the
 *     constant path (e.g. `SCREEN_NAMES.tasks`). It auto-dismisses after
 *     4 seconds or on the next click.
 *  4. The native browser context menu still appears as normal.
 */
export default function ScreenNameInspector() {
  const lookupRef = useRef<Map<string, string[]> | null>(null);
  const [result, setResult] = useState<{
    paths: string[];
    displayText: string;
    x: number;
    y: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the lookup once on mount
  useEffect(() => {
    lookupRef.current = buildNameLookup();
  }, []);

  const dismiss = useCallback(() => {
    setResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Try to match an element's text against the lookup map.
  // Returns the first match found, checking exact then prefix.
  const findMatch = useCallback(
    (el: HTMLElement): { paths: string[]; displayText: string } | null => {
      const lookup = lookupRef.current;
      if (!lookup) return null;

      // Only consider the element's own direct text (not deeply nested children).
      // For elements with few children (headings, buttons, links, spans), this
      // gives the actual display label rather than concatenated page text.
      const text = el.innerText?.trim();
      if (!text || text.length > 200) return null;

      // Exact match
      const exact = lookup.get(text);
      if (exact) return { paths: exact, displayText: text };

      // Prefix match — handles "Your Medications (5)" matching "Your Medications"
      for (const [key, paths] of lookup) {
        if (text.startsWith(key) && key.length >= 3) {
          return { paths, displayText: key };
        }
      }

      return null;
    },
    [],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const lookup = lookupRef.current;
      if (!lookup) return;

      // Walk up from the target, checking each element (max 6 levels)
      let el = e.target as HTMLElement | null;
      let depth = 0;
      while (el && depth < 6) {
        const match = findMatch(el);
        if (match) {
          setResult({
            paths: match.paths,
            displayText: match.displayText,
            x: e.clientX,
            y: e.clientY,
          });
          // Auto-dismiss after 4 seconds
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(dismiss, 4000);
          return;
        }
        el = el.parentElement;
        depth++;
      }
      // No match — dismiss any previous result
      dismiss();
    };

    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [findMatch, dismiss]);

  // Dismiss on any regular click
  useEffect(() => {
    if (!result) return;
    const handler = () => dismiss();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [result, dismiss]);

  if (!result) return null;

  // Position the badge near the click, nudging to stay on screen
  const badgeWidth = 320;
  const badgeHeight = 80;
  const left = Math.min(result.x + 8, window.innerWidth - badgeWidth - 16);
  const top =
    result.y + badgeHeight + 16 > window.innerHeight
      ? result.y - badgeHeight - 8
      : result.y + 8;

  return (
    <div
      style={{ left, top }}
      className="fixed z-[9999] max-w-xs rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 shadow-lg dark:border-blue-700 dark:bg-blue-950"
    >
      <p className="text-[10px] font-medium tracking-wider text-blue-400 uppercase dark:text-blue-500">
        Screen Name
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        &ldquo;{result.displayText}&rdquo;
      </p>
      <div className="mt-1 space-y-0.5">
        {result.paths.map((p) => (
          <p
            key={p}
            className="font-mono text-sm font-semibold text-blue-800 dark:text-blue-300"
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
