"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { pageTitle } from "@/lib/styles";
import TabBar from "@/components/ui/TabBar";

const ExercisesTab = dynamic(() => import("@/components/gym/ExercisesTab"));
const RoutinesTab = dynamic(() => import("@/components/gym/RoutinesTab"));

type Tab = "exercises" | "routines";

const TABS = [
  { key: "exercises", label: "Exercises" },
  { key: "routines", label: "Routines" },
];

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

  return (
    <div>
      <h1 className={`mb-4 ${pageTitle}`}>Gym</h1>
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => router.push(`/gym?tab=${t}`)}
      />
      {tab === "exercises" && <ExercisesTab />}
      {tab === "routines" && <RoutinesTab />}
    </div>
  );
}
