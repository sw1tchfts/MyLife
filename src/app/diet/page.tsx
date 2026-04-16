"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { pageTitle } from "@/lib/styles";
import TabBar from "@/components/ui/TabBar";

const FoodLibraryTab = dynamic(
  () => import("@/components/diet/FoodLibraryTab"),
);
const DietRoutineTab = dynamic(
  () => import("@/components/diet/DietRoutineTab"),
);

/* ── Types ─────────────────────────────────────────── */

type Tab = "library" | "diet";

const TABS = [
  { key: "library", label: "Food Library" },
  { key: "diet", label: "Diet" },
];

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

  return (
    <div>
      <h1 className={`mb-4 ${pageTitle}`}>Diet & Nutrition</h1>
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => router.push(`/diet?tab=${t}`)}
      />
      {tab === "library" && <FoodLibraryTab />}
      {tab === "diet" && <DietRoutineTab />}
    </div>
  );
}
