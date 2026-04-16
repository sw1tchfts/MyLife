"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import {
  pageTitle,
  sectionTitle,
  sectionDivider,
  label,
  labelSm,
  hint,
  badge,
  badgeSm,
  card,
  panel,
  input,
  inputSm,
  select,
  btnPrimary,
  btnSecondary,
  btnDanger,
  btnDangerSm,
  btnSuccess,
  btnSuccessSm,
  btnSuccessXs,
  btnInfo,
  btnGhost,
  pillActive,
  pillInactive,
  emptyState,
  deleteBtn,
  navLinkBase,
  navLinkActive,
  navLinkInactive,
  tabWrapper,
  tabButton,
  tabButtonActive,
  tabButtonInactive,
} from "@/lib/styles";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className={sectionTitle}>{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TokenLabel({ name }: { name: string }) {
  return <code className="mb-1 block text-xs text-faint">{name}</code>;
}

export default function UIElementsTab() {
  const { showToast } = useToast();
  const [sampleInput, setSampleInput] = useState("");
  const [sampleSelect, setSampleSelect] = useState("option1");
  const [activePill, setActivePill] = useState<string | null>("one");
  const [activeTab, setActiveTab] = useState("tab1");
  const [checkboxA, setCheckboxA] = useState(true);
  const [checkboxB, setCheckboxB] = useState(false);

  return (
    <div className="space-y-10">
      {/* ── Typography ──────────────────────────────── */}
      <Section title="Typography">
        <div className="space-y-4">
          <div>
            <TokenLabel name="pageTitle" />
            <p className={pageTitle}>Page Title (28px Bold)</p>
          </div>
          <div>
            <TokenLabel name="sectionTitle" />
            <p className={sectionTitle}>Section Title (22px Semibold)</p>
          </div>
          <div>
            <TokenLabel name="label" />
            <p className={label}>Label (15px Medium)</p>
          </div>
          <div>
            <TokenLabel name="labelSm" />
            <p className={labelSm}>Small Label (13px)</p>
          </div>
          <div>
            <TokenLabel name="hint" />
            <p className={hint}>Hint text (13px faint)</p>
          </div>
          <div>
            <TokenLabel name="text-heading / text-body / text-muted / text-faint" />
            <div className="mt-1 flex flex-wrap gap-4">
              <span className="text-heading">Heading</span>
              <span className="text-body">Body</span>
              <span className="text-muted">Muted</span>
              <span className="text-faint">Faint</span>
            </div>
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Buttons ──────────────────────────────── */}
      <Section title="Buttons">
        <div className="space-y-6">
          {/* Primary row */}
          <div>
            <TokenLabel name="btnPrimary" />
            <div className="flex flex-wrap gap-3">
              <button className={btnPrimary}>Primary</button>
              <button className={btnPrimary} disabled>
                Disabled
              </button>
            </div>
          </div>

          {/* Secondary */}
          <div>
            <TokenLabel name="btnSecondary" />
            <div className="flex flex-wrap gap-3">
              <button className={btnSecondary}>Secondary</button>
            </div>
          </div>

          {/* Danger */}
          <div>
            <TokenLabel name="btnDanger / btnDangerSm" />
            <div className="flex flex-wrap items-center gap-3">
              <button className={btnDanger}>Danger</button>
              <button className={btnDangerSm}>Danger Sm</button>
            </div>
          </div>

          {/* Success */}
          <div>
            <TokenLabel name="btnSuccess / btnSuccessSm / btnSuccessXs" />
            <div className="flex flex-wrap items-center gap-3">
              <button className={btnSuccess}>Success</button>
              <button className={btnSuccessSm}>Success Sm</button>
              <button className={btnSuccessXs}>Success Xs</button>
            </div>
          </div>

          {/* Info */}
          <div>
            <TokenLabel name="btnInfo" />
            <div className="flex flex-wrap gap-3">
              <button className={btnInfo}>Info</button>
            </div>
          </div>

          {/* Ghost */}
          <div>
            <TokenLabel name="btnGhost" />
            <div className="flex flex-wrap gap-3">
              <button className={btnGhost}>Ghost</button>
            </div>
          </div>

          {/* Delete icon button */}
          <div>
            <TokenLabel name="deleteBtn" />
            <button className={deleteBtn}>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Common combos */}
          <div>
            <TokenLabel name="Common combo: Cancel + Save" />
            <div className="flex gap-3">
              <button className={btnSecondary}>Cancel</button>
              <button className={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Badges ──────────────────────────────── */}
      <Section title="Badges">
        <div className="space-y-6">
          {/* Standard badge */}
          <div>
            <TokenLabel name="badge (standard)" />
            <div className="flex flex-wrap gap-2">
              <span className={`${badge} bg-accent-soft text-accent-text`}>
                Default
              </span>
              <span className={`${badge} bg-success-soft text-success-text`}>
                Success
              </span>
              <span className={`${badge} bg-danger-soft text-danger-text`}>
                Danger
              </span>
              <span className={`${badge} bg-warning-soft text-warning-text`}>
                Warning
              </span>
              <span className={`${badge} bg-info-soft text-info-text`}>
                Info
              </span>
              <span className={`${badge} bg-purple-soft text-purple-text`}>
                Purple
              </span>
              <span className={`${badge} bg-amber-soft text-amber-text`}>
                Amber
              </span>
              <span className={`${badge} bg-elevated text-body`}>Neutral</span>
            </div>
          </div>

          {/* Small badge */}
          <div>
            <TokenLabel name="badgeSm (compact)" />
            <div className="flex flex-wrap gap-2">
              <span className={`${badgeSm} bg-accent-soft text-accent-text`}>
                Default
              </span>
              <span className={`${badgeSm} bg-success-soft text-success-text`}>
                Success
              </span>
              <span className={`${badgeSm} bg-danger-soft text-danger-text`}>
                Danger
              </span>
              <span className={`${badgeSm} bg-warning-soft text-warning-text`}>
                Warning
              </span>
              <span className={`${badgeSm} bg-info-soft text-info-text`}>
                Info
              </span>
              <span className={`${badgeSm} bg-purple-soft text-purple-text`}>
                Purple
              </span>
              <span className={`${badgeSm} bg-amber-soft text-amber-text`}>
                Amber
              </span>
              <span className={`${badgeSm} bg-elevated text-body`}>
                Neutral
              </span>
            </div>
          </div>

          {/* Component badges */}
          <div>
            <TokenLabel name="StatusBadge component" />
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="TODO" />
              <StatusBadge status="IN_PROGRESS" />
              <StatusBadge status="DONE" />
            </div>
          </div>

          <div>
            <TokenLabel name="PriorityBadge component" />
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority="LOW" />
              <PriorityBadge priority="MEDIUM" />
              <PriorityBadge priority="HIGH" />
            </div>
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Pills / Filters ──────────────────────── */}
      <Section title="Pills / Filters">
        <div className="space-y-4">
          <TokenLabel name="pillActive / pillInactive" />
          <div className="flex flex-wrap gap-2">
            {["one", "two", "three"].map((p) => (
              <button
                key={p}
                onClick={() => setActivePill(activePill === p ? null : p)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  activePill === p ? pillActive : pillInactive
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Tabs ─────────────────────────────────── */}
      <Section title="Tabs">
        <div className="space-y-4">
          <TokenLabel name="tabWrapper / tabButton / tabButtonActive / tabButtonInactive" />
          <div className={tabWrapper}>
            {["tab1", "tab2", "tab3"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`${tabButton} ${activeTab === t ? tabButtonActive : tabButtonInactive}`}
              >
                {t === "tab1"
                  ? "First Tab"
                  : t === "tab2"
                    ? "Second Tab"
                    : "Third Tab"}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-body">
            Content for{" "}
            {activeTab === "tab1"
              ? "First Tab"
              : activeTab === "tab2"
                ? "Second Tab"
                : "Third Tab"}
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Form Inputs ──────────────────────────── */}
      <Section title="Form Inputs">
        <div className="space-y-6">
          {/* Standard input */}
          <div>
            <TokenLabel name="input (standard)" />
            <label className={label}>Email Address</label>
            <input
              type="text"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              placeholder="you@example.com"
              className={input}
            />
          </div>

          {/* Small input */}
          <div>
            <TokenLabel name="inputSm (compact)" />
            <label className={labelSm}>Search</label>
            <input
              type="text"
              placeholder="Search..."
              className={`mt-1 ${inputSm}`}
            />
          </div>

          {/* Select */}
          <div>
            <TokenLabel name="select" />
            <label className={label}>Category</label>
            <select
              value={sampleSelect}
              onChange={(e) => setSampleSelect(e.target.value)}
              className={select}
            >
              <option value="option1">Option One</option>
              <option value="option2">Option Two</option>
              <option value="option3">Option Three</option>
            </select>
          </div>

          {/* Textarea */}
          <div>
            <TokenLabel name="textarea (uses input border radius)" />
            <label className={label}>Description</label>
            <textarea
              rows={3}
              placeholder="Write something..."
              className="mt-1 block w-full rounded-[10px] border border-input-border bg-card px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Checkbox */}
          <div>
            <TokenLabel name="checkbox" />
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkboxA}
                  onChange={(e) => setCheckboxA(e.target.checked)}
                  className="h-4 w-4 rounded border-input-border"
                />
                <span className="text-sm text-body">Checked option</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkboxB}
                  onChange={(e) => setCheckboxB(e.target.checked)}
                  className="h-4 w-4 rounded border-input-border"
                />
                <span className="text-sm text-body">Unchecked option</span>
              </label>
            </div>
          </div>

          {/* Disabled input */}
          <div>
            <TokenLabel name="input (disabled)" />
            <label className={label}>Disabled Field</label>
            <input
              type="text"
              value="Cannot edit"
              disabled
              className={`${input} opacity-50`}
            />
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Cards & Panels ───────────────────────── */}
      <Section title="Cards & Panels">
        <div className="space-y-6">
          {/* Card */}
          <div>
            <TokenLabel name="card (hoverable)" />
            <div className={card}>
              <h3 className="font-semibold text-heading">Card Title</h3>
              <p className="mt-1 text-sm text-faint">
                A card with hover state. Used for task cards and clickable
                items.
              </p>
              <div className="mt-3 flex gap-2">
                <span className={`${badgeSm} bg-accent-soft text-accent-text`}>
                  Badge
                </span>
              </div>
            </div>
          </div>

          {/* Panel */}
          <div>
            <TokenLabel name="panel (static container)" />
            <div className={`${panel} p-4`}>
              <h3 className="text-sm font-semibold text-body">Panel Header</h3>
              <p className="mt-1 text-sm text-faint">
                A panel without hover state. Used for search sections and form
                containers.
              </p>
            </div>
          </div>

          {/* Accent form panel */}
          <div>
            <TokenLabel name="Accent panel (inline create forms)" />
            <div className="rounded-xl border border-accent bg-accent-soft p-4">
              <h3 className="mb-3 text-sm font-semibold text-heading">
                Create New Item
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Item name..."
                  className={`flex-1 ${inputSm}`}
                />
                <button className={btnPrimary}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Empty State ──────────────────────────── */}
      <Section title="Empty State">
        <TokenLabel name="emptyState" />
        <div className={emptyState}>
          <p className="text-muted">Nothing here yet</p>
          <p className="mt-1 text-sm text-faint">
            This is how empty states look across the app
          </p>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Navigation Links ─────────────────────── */}
      <Section title="Navigation Links">
        <div className="space-y-4">
          <TokenLabel name="navLinkBase + navLinkActive / navLinkInactive" />
          <div className="w-56 space-y-0.5 rounded-xl border border-border bg-card p-2">
            <div className={`${navLinkBase} ${navLinkActive}`}>
              <svg
                className="h-4 w-4 text-accent-text"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Active Link
            </div>
            <div className={`${navLinkBase} ${navLinkInactive}`}>
              <svg
                className="h-4 w-4 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Inactive Link
            </div>
          </div>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Toast ─────────────────────────────────── */}
      <Section title="Toast Notifications">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => showToast({ message: "This is a toast message" })}
            className={btnPrimary}
          >
            Show Toast
          </button>
          <button
            onClick={() =>
              showToast({
                message: "Deleted item",
                onUndo: () => {},
                onExpire: () => {},
              })
            }
            className={btnSecondary}
          >
            Toast with Undo
          </button>
        </div>
      </Section>

      <div className={sectionDivider} />

      {/* ── Dividers ──────────────────────────────── */}
      <Section title="Dividers">
        <div className="space-y-4">
          <TokenLabel name="sectionDivider" />
          <div className={sectionDivider} />
          <p className="text-sm text-faint">
            A simple border-top used between sections.
          </p>
        </div>
      </Section>
    </div>
  );
}
