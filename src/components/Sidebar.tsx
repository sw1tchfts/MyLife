"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { navLinkBase, navLinkActive, navLinkInactive } from "@/lib/styles";

interface SidebarProps {
  userEmail: string;
}

const MANAGE = [
  { href: "/admin", label: "Admin", icon: AdminIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Link href="/" className="text-lg font-bold text-heading">
          MyLife
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-muted hover:bg-elevated"
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
        className={`fixed top-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* App name */}
        <div className="flex h-14 items-center px-4">
          <Link href="/" className="text-lg font-bold text-heading">
            MyLife
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2" onClick={closeMobile}>
          {/* Mission Control */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Mission Control
            </p>
            <Link
              href="/tasks"
              className={`${navLinkBase} ${
                pathname.startsWith("/tasks") ? navLinkActive : navLinkInactive
              }`}
            >
              <ListIcon active={pathname.startsWith("/tasks")} />
              Tasks
            </Link>
          </div>

          {/* Health */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Health
            </p>
            <Link
              href="/diet"
              className={`${navLinkBase} ${
                pathname.startsWith("/diet") ? navLinkActive : navLinkInactive
              }`}
            >
              <DietIcon active={pathname.startsWith("/diet")} />
              Diet & Nutrition
            </Link>
            <Link
              href="/gym"
              className={`${navLinkBase} ${
                pathname.startsWith("/gym") ? navLinkActive : navLinkInactive
              }`}
            >
              <GymIcon active={pathname.startsWith("/gym")} />
              Gym
            </Link>
            <Link
              href="/medications"
              className={`${navLinkBase} ${
                pathname.startsWith("/medications")
                  ? navLinkActive
                  : navLinkInactive
              }`}
            >
              <MedIcon active={pathname.startsWith("/medications")} />
              Medications
            </Link>
          </div>

          {/* Other Applications */}
          <div className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Other Applications
            </p>
            <Link
              href="/journal"
              className={`${navLinkBase} ${
                pathname.startsWith("/journal")
                  ? navLinkActive
                  : navLinkInactive
              }`}
            >
              <JournalIcon active={pathname.startsWith("/journal")} />
              Journal
            </Link>
            <Link
              href="/rankings"
              className={`${navLinkBase} ${
                pathname.startsWith("/rankings")
                  ? navLinkActive
                  : navLinkInactive
              }`}
            >
              <RankingIcon active={pathname.startsWith("/rankings")} />
              Pairwise Ranker
            </Link>
            <Link
              href="/diagrams"
              className={`${navLinkBase} ${
                pathname.startsWith("/diagrams")
                  ? navLinkActive
                  : navLinkInactive
              }`}
            >
              <DiagramIcon active={pathname.startsWith("/diagrams")} />
              Diagram Creator
            </Link>
          </div>

          {/* Manage */}
          <div>
            <p className="mb-1 px-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Manage
            </p>
            {MANAGE.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${navLinkBase} ${
                    active ? navLinkActive : navLinkInactive
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
        <div className="border-t border-border p-3">
          <p className="truncate text-xs text-faint">{userEmail}</p>
          <button
            onClick={handleSignOut}
            className="mt-1 text-xs text-muted hover:text-body"
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
  const cls = active ? "text-accent-text" : "text-muted";
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

function AdminIcon({ active }: { active: boolean }) {
  const cls = active ? "text-accent-text" : "text-muted";
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

function MedIcon({ active }: { active: boolean }) {
  const cls = active ? "text-accent-text" : "text-muted";
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
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}

function DietIcon({ active }: { active: boolean }) {
  const cls = active ? "text-accent-text" : "text-muted";
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

function GymIcon({ active }: { active: boolean }) {
  const cls = active ? "text-accent-text" : "text-muted";
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
        d="M3 12h1m16 0h1m-2-4v8m-14-8v8m3-10v12m8-12v12"
      />
    </svg>
  );
}

function RankingIcon({ active }: { active: boolean }) {
  const cls = active ? "text-accent-text" : "text-muted";
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
  const cls = active ? "text-accent-text" : "text-muted";
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
  const cls = active ? "text-accent-text" : "text-muted";
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
  const cls = active ? "text-accent-text" : "text-muted";
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
