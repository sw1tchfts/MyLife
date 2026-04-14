"use client";

import { useEffect, useRef, useCallback } from "react";

export default function TaskNotifications() {
  const notifiedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndNotify = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    try {
      const res = await fetch("/api/tasks/notifications");
      if (!res.ok) return;
      const { overdue, dueToday } = (await res.json()) as {
        overdue: number;
        dueToday: number;
      };

      if (!notifiedRef.current) {
        notifiedRef.current = true;

        if (overdue > 0) {
          new Notification("Overdue Tasks", {
            body: `You have ${overdue} overdue task${overdue !== 1 ? "s" : ""}`,
            icon: "/favicon.ico",
            tag: "overdue-summary",
          });
        }

        if (dueToday > 0) {
          new Notification("Due Today", {
            body: `You have ${dueToday} task${dueToday !== 1 ? "s" : ""} due today`,
            icon: "/favicon.ico",
            tag: "today-summary",
          });
        }
      }
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    // Only run if notifications are supported and granted
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Check immediately on mount
    checkAndNotify();

    // Check every 15 minutes
    intervalRef.current = setInterval(checkAndNotify, 15 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAndNotify]);

  return null; // This component renders nothing
}
