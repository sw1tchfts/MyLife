"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  pageTitle,
  tabWrapper,
  tabWrapperScrollable,
  tabButton,
  tabButtonActive,
  tabButtonInactive,
} from "@/lib/styles";
import UIElementsTab from "@/components/admin/UIElementsTab";

type Tab = "ui-elements";

const TABS: { key: Tab; label: string }[] = [
  { key: "ui-elements", label: "UI Elements" },
];

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted">Loading...</p>}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as Tab) || "ui-elements";

  const setTab = (t: Tab) => router.push(`/admin?tab=${t}`);

  return (
    <div>
      <h1 className={`mb-4 ${pageTitle}`}>Admin</h1>

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

      {tab === "ui-elements" && <UIElementsTab />}
    </div>
  );
}
