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
    <Suspense fallback={<p className="text-center text-muted">Loading...</p>}>
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
      <h1 className={`mb-4 ${pageTitle}`}>Diet & Nutrition</h1>

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

      {tab === "library" && <FoodLibraryTab />}
      {tab === "diet" && <DietRoutineTab />}
    </div>
  );
}
