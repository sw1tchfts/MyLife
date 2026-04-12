"use client";

import { useEffect, useRef, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
}

function getOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < now,
  );
}

function getDueTodayTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && t.dueDate.slice(0, 10) === today,
  );
}

export default function TaskNotifications() {
  const notifiedRef = useRef(new Set<string>());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndNotify = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) return;
      const tasks: Task[] = await res.json();

      const overdue = getOverdueTasks(tasks);
      const dueToday = getDueTodayTasks(tasks);

      for (const task of overdue) {
        const key = `overdue-${task.id}`;
        if (!notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          new Notification("Overdue Task", {
            body: task.title,
            icon: "/favicon.ico",
            tag: key,
          });
        }
      }

      for (const task of dueToday) {
        const key = `today-${task.id}`;
        if (!notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          new Notification("Due Today", {
            body: task.title,
            icon: "/favicon.ico",
            tag: key,
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
