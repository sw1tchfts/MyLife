"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const FoodLibraryTab = dynamic(
  () => import("@/components/diet/FoodLibraryTab"),
);
const DietRoutineTab = dynamic(
  () => import("@/components/diet/DietRoutineTab"),
);

/* ── Types ─────────────────────────────────────────── */

type Tab = "library" | "diet";

/* ── Page wrapper ──────────────────────────────────── */

export default function DietPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-muted">Loading...</p>}
    >
      <DietContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function DietContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "library";

  const setTab = (t: Tab) => router.push(`/diet?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "library", label: "Food Library" },
    { key: "diet", label: "Diet" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-heading">
        Diet & Nutrition
      </h1>

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-white"
                : "text-muted hover:bg-elevated"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "library" && <FoodLibraryTab />}
      {tab === "diet" && <DietRoutineTab />}
    </div>
  );
}
