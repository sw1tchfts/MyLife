/* ── Design System: Shared Style Constants ──────────────────────────
 *
 * Single source of truth for repeated Tailwind class patterns.
 * Import and compose these instead of duplicating class strings.
 * Color values come from design tokens defined in globals.css @theme.
 * ------------------------------------------------------------------ */

/* ── Badges ─────────────────────────────────────────────────────── */

export const badge =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export const badgeSm =
  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium";

/* ── Cards & Panels ─────────────────────────────────────────────── */

export const card =
  "rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md";

export const panel = "rounded-lg border border-border bg-card";

/* ── Form Inputs ────────────────────────────────────────────────── */

export const input =
  "mt-1 block w-full rounded-md border border-input-border bg-card px-3 py-2 text-heading shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const inputSm =
  "w-full rounded-md border border-input-border bg-card px-2 py-1.5 text-sm text-heading";

export const select =
  "mt-1 w-full rounded-md border border-input-border bg-card px-2 py-1.5 text-sm text-heading";

/* ── Buttons ────────────────────────────────────────────────────── */

export const btnPrimary =
  "rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50";

export const btnSecondary =
  "rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-body hover:bg-elevated";

export const btnDanger =
  "rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50";

export const btnGhost =
  "rounded-md px-4 py-2 text-sm font-medium text-muted hover:bg-elevated hover:text-body";

/* ── Toggle / Pill Button ───────────────────────────────────────── */

export const pillActive = "border-accent bg-accent-soft text-accent-text";

export const pillInactive = "border-input-border text-muted hover:bg-elevated";

/* ── Typography ─────────────────────────────────────────────────── */

export const pageTitle = "text-2xl font-bold text-heading";

export const sectionTitle = "text-lg font-semibold text-heading";

export const label = "block text-sm font-medium text-body";

export const labelSm = "block text-xs text-faint";

export const hint = "text-xs text-faint";

/* ── Navigation ─────────────────────────────────────────────────── */

export const navLinkBase =
  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors";

export const navLinkActive = "bg-accent-soft font-medium text-accent-text";

export const navLinkInactive = "text-muted hover:bg-elevated hover:text-body";

/* ── Misc ───────────────────────────────────────────────────────── */

export const emptyState =
  "rounded-lg border-2 border-dashed border-input-border py-12 text-center";

export const deleteBtn =
  "rounded p-1 text-faint hover:bg-danger-soft hover:text-danger-text";

export const sectionDivider = "border-t border-border";
