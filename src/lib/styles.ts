/* ── Design System: Shared Style Constants ──────────────────────────
 *
 * Single source of truth for repeated Tailwind class patterns.
 * Import and compose these instead of duplicating class strings.
 * Color values come from design tokens defined in globals.css @theme.
 * Visual language follows Apple Human Interface Guidelines.
 * ------------------------------------------------------------------ */

/* ── Badges ─────────────────────────────────────────────────────── */

export const badge =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export const badgeSm =
  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium";

/* ── Cards & Panels ─────────────────────────────────────────────── */

export const card =
  "rounded-xl border border-border bg-card p-4 transition-colors hover:bg-elevated/40";

export const panel = "rounded-xl border border-border bg-card";

/* ── Form Inputs ────────────────────────────────────────────────── */

export const input =
  "mt-1 block w-full rounded-[10px] border border-input-border bg-card px-3 py-2 text-heading shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const inputSm =
  "w-full rounded-[10px] border border-input-border bg-card px-2 py-1.5 text-sm text-heading";

export const select =
  "mt-1 w-full rounded-[10px] border border-input-border bg-card px-2 py-1.5 text-sm text-heading";

/* ── Buttons ────────────────────────────────────────────────────── */

export const btnPrimary =
  "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover active:opacity-80 disabled:opacity-50";

export const btnSecondary =
  "rounded-full border border-input-border bg-card px-4 py-2.5 text-sm font-medium text-body hover:bg-elevated active:opacity-80";

export const btnDanger =
  "rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:bg-danger-hover active:opacity-80 disabled:opacity-50";

export const btnDangerSm =
  "rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white hover:bg-danger-hover active:opacity-80";

export const btnSuccess =
  "rounded-full bg-success px-5 py-2.5 text-sm font-semibold text-white hover:bg-success-hover active:opacity-80 disabled:opacity-50";

export const btnSuccessSm =
  "rounded-full bg-success px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-success-hover active:opacity-80 disabled:opacity-50";

export const btnSuccessXs =
  "rounded-full bg-success px-3 py-1 text-xs font-semibold text-white hover:bg-success-hover active:opacity-80 disabled:opacity-50";

export const btnInfo =
  "rounded-full bg-info px-5 py-2 text-sm font-semibold text-white hover:bg-info-hover active:opacity-80 disabled:opacity-50";

export const btnGhost =
  "rounded-[10px] px-4 py-2.5 text-sm font-medium text-muted hover:bg-elevated hover:text-body active:opacity-80";

/* ── Toggle / Pill Button ───────────────────────────────────────── */

export const pillActive = "border-accent bg-accent-soft text-accent-text";

export const pillInactive = "border-input-border text-muted hover:bg-elevated";

/* ── Typography (Apple HIG scale) ──────────────────────────────── */

export const pageTitle = "text-[28px] font-bold tracking-tight text-heading";

export const sectionTitle = "text-[22px] font-semibold text-heading";

export const label = "block text-[15px] font-medium text-body";

export const labelSm = "block text-[13px] text-faint";

export const hint = "text-[13px] text-faint";

/* ── Navigation ─────────────────────────────────────────────────── */

export const navLinkBase =
  "flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-sm transition-colors";

export const navLinkActive = "bg-accent-soft font-medium text-accent-text";

export const navLinkInactive = "text-muted hover:bg-elevated hover:text-body";

/* ── Tabs ──────────────────────────────────────────────────────── */

export const tabWrapper = "flex gap-1 border-b border-border";

export const tabWrapperScrollable =
  "-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0";

export const tabButton =
  "shrink-0 rounded-t-[10px] px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors";

export const tabButtonActive = "bg-accent text-white";

export const tabButtonInactive = "text-muted hover:bg-elevated";

/* ── Misc ──────────────────────────────────────────────────────── */

export const emptyState =
  "rounded-xl border-2 border-dashed border-input-border py-12 text-center";

export const deleteBtn =
  "rounded-[10px] p-1 text-faint hover:bg-danger-soft hover:text-danger-text";

export const sectionDivider = "border-t border-border";
