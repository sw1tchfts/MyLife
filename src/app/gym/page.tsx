"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  pageTitle,
  tabWrapper,
  tabWrapperScrollable,
  tabButton,
  tabButtonActive,
  tabButtonInactive,
} from "@/lib/styles";

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
      <h1 className={`mb-4 ${pageTitle}`}>Gym</h1>

      <div className={`mb-6 ${tabWrapperScrollable}`}>
        <div className={tabWrapper}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`${tabButton} ${tab === t.key ? tabButtonActive : tabButtonInactive}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "exercises" && <ExercisesTab />}
      {tab === "routines" && <RoutinesTab />}
    </div>
  );
}
