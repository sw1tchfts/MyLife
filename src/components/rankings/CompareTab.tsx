"use client";

import { useState, useEffect, useCallback } from "react";
import { emptyState, btnSecondary } from "@/lib/styles";

interface RankingItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string;
  elo: number;
  wins: number;
  losses: number;
  ties: number;
  categoryId: string;
}

export default function CompareTab({
  listId,
  onComparisonDone,
}: {
  listId: string;
  onComparisonDone: () => void;
}) {
  const [left, setLeft] = useState<RankingItem | null>(null);
  const [right, setRight] = useState<RankingItem | null>(null);
  const [loadingPair, setLoadingPair] = useState(true);
  const [error, setError] = useState("");
  const [totalDone, setTotalDone] = useState(0);

  const fetchPair = useCallback(() => {
    setLoadingPair(true);
    setError("");
    fetch(`/api/rankings/compare?categoryId=${listId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setLeft(data.left);
          setRight(data.right);
        }
        setLoadingPair(false);
      });
  }, [listId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rankings/compare?categoryId=${listId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setLeft(data.left);
          setRight(data.right);
        }
        setLoadingPair(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listId]);

  const submitChoice = async (result: "LEFT" | "RIGHT" | "TIE" | "SKIP") => {
    if (!left || !right) return;
    await fetch("/api/rankings/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leftItemId: left.id,
        rightItemId: right.id,
        categoryId: listId,
        result,
      }),
    });
    setTotalDone((n) => n + 1);
    onComparisonDone();
    fetchPair();
  };

  if (error) {
    return (
      <div className={emptyState}>
        <p className="text-muted">{error}</p>
        <p className="mt-1 text-sm text-faint">
          Add more items to start comparing
        </p>
      </div>
    );
  }

  if (loadingPair || !left || !right) {
    return <p className="text-center text-muted">Loading matchup...</p>;
  }

  return (
    <div className="space-y-6">
      {totalDone > 0 && (
        <p className="text-center text-xs text-faint">
          {totalDone} comparison{totalDone !== 1 ? "s" : ""} this session
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Left item */}
        <button
          onClick={() => submitChoice("LEFT")}
          className="group rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-heading group-hover:text-accent-text">
            {left.title}
          </h3>
          {left.description && (
            <p className="mt-2 text-sm text-muted">
              {left.description}
            </p>
          )}
          {left.tags && (
            <div className="mt-3 flex flex-wrap gap-1">
              {left.tags.split(",").map((t, i) => (
                <span
                  key={i}
                  className="rounded bg-elevated px-1.5 py-0.5 text-xs text-muted"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-center text-xs font-medium text-muted group-hover:text-accent-text">
            Click to pick this one
          </p>
        </button>

        {/* VS divider */}
        <div className="flex items-center justify-center">
          <span className="text-2xl font-black text-faint">
            VS
          </span>
        </div>

        {/* Right item */}
        <button
          onClick={() => submitChoice("RIGHT")}
          className="group rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-heading group-hover:text-accent-text">
            {right.title}
          </h3>
          {right.description && (
            <p className="mt-2 text-sm text-muted">
              {right.description}
            </p>
          )}
          {right.tags && (
            <div className="mt-3 flex flex-wrap gap-1">
              {right.tags.split(",").map((t, i) => (
                <span
                  key={i}
                  className="rounded bg-elevated px-1.5 py-0.5 text-xs text-muted"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-center text-xs font-medium text-muted group-hover:text-accent-text">
            Click to pick this one
          </p>
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => submitChoice("TIE")}
          className={btnSecondary}
        >
          Tie / Equal
        </button>
        <button
          onClick={() => submitChoice("SKIP")}
          className={btnSecondary}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
