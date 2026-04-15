"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ExercisesTab = dynamic(() => import("@/components/gym/ExercisesTab"));
const RoutinesTab = dynamic(() => import("@/components/gym/RoutinesTab"));

type Tab = "exercises" | "routines";

/* ── Page wrapper ──────────────────────────────────── */

export default function GymPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted">Loading...</p>}>
      <GymContent />
    </Suspense>
  );
}

/* ── Main content ──────────────────────────────────── */

function GymContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "exercises";

  const setTab = (t: Tab) => router.push(`/gym?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "exercises", label: "Exercises" },
    { key: "routines", label: "Routines" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-heading">Gym</h1>

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

      {tab === "exercises" && <ExercisesTab />}
      {tab === "routines" && <RoutinesTab />}
    </div>
  );
}
