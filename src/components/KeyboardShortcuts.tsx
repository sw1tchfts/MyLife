"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QuickAddModal from "./QuickAddModal";

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "n":
        case "N":
          // Quick add
          e.preventDefault();
          setQuickAddOpen(true);
          break;
        case "1":
          router.push("/?view=list");
          break;
        case "2":
          router.push("/?view=calendar");
          break;
        case "3":
          router.push("/?view=timeline");
          break;
        case "4":
          router.push("/?view=dashboard");
          break;
        case "5":
          router.push("/?view=focus");
          break;
        case "/":
          // Focus search
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder="Search tasks..."]',
          );
          if (searchInput) searchInput.focus();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return <QuickAddModal isOpen={quickAddOpen} onClose={closeQuickAdd} />;
}
