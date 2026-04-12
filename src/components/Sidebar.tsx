"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  userEmail: string;
}

const VIEWS = [
  { key: "list", label: "List", icon: ListIcon },
  { key: "calendar", label: "Calendar", icon: CalendarIcon },
  { key: "timeline", label: "Timeline", icon: TimelineIcon },
  { key: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { key: "focus", label: "Focus", icon: FocusIcon },
] as const;

const MANAGE = [
  { href: "/admin", label: "Admin", icon: AdminIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentView = searchParams.get("view") || "list";
  const isHome = pathname === "/";

  const closeMobile = () => setMobileOpen(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 lg:hidden">
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          MyLife
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {mobileOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
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
          )}
        </button>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-transform dark:border-gray-700 dark:bg-gray-900 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* App name */}
        <div className="flex h-14 items-center px-4">
          <Link
            href="/"
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            MyLife
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2" onClick={closeMobile}>
          {/* Views section */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Views
            </p>
            {VIEWS.map((view) => {
              const active = isHome && currentView === view.key;
              return (
                <Link
                  key={view.key}
                  href={`/?view=${view.key}`}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <view.icon active={active} />
                  {view.label}
                </Link>
              );
            })}
          </div>

          {/* Diet section */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Health
            </p>
            <Link
              href="/diet"
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                pathname.startsWith("/diet")
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <DietIcon active={pathname.startsWith("/diet")} />
              Diet & Nutrition
            </Link>
          </div>

          {/* Journal section */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Journal
            </p>
            <Link
              href="/journal"
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                pathname.startsWith("/journal")
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <JournalIcon active={pathname.startsWith("/journal")} />
              Journal
            </Link>
          </div>

          {/* Rankings section */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Rankings
            </p>
            <Link
              href="/rankings"
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                pathname.startsWith("/rankings")
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <RankingIcon active={pathname.startsWith("/rankings")} />
              Pairwise Ranker
            </Link>
          </div>

          {/* Diagrams section */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Diagrams
            </p>
            <Link
              href="/diagrams"
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                pathname.startsWith("/diagrams")
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <DiagramIcon active={pathname.startsWith("/diagrams")} />
              Diagram Creator
            </Link>
          </div>

          {/* Manage section */}
          <div>
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Manage
            </p>
            {MANAGE.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <item.icon active={active} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <p className="truncate text-xs text-gray-500">{userEmail}</p>
          <button
            onClick={handleSignOut}
            className="mt-1 text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Icons ──────────────────────────────────────────── */

function ListIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
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
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function TimelineIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zm10-2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z"
      />
    </svg>
  );
}

function FocusIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function AdminIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function DietIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function RankingIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
      />
    </svg>
  );
}

function JournalIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function DiagramIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM9 7h5M7 10v4m10-4v4M4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const cls = active ? "text-blue-600" : "text-gray-400";
  return (
    <svg
      className={`h-4 w-4 ${cls}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
