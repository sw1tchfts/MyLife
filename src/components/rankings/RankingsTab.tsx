"use client";

import { emptyState } from "@/lib/styles";

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

export default function RankingsTab({
  list,
}: {
  list: { items: RankingItem[]; _count: { comparisons: number } };
}) {
  const items = [...list.items].sort((a, b) => b.elo - a.elo);
  const maxElo = items.length > 0 ? items[0].elo : 1500;
  const minElo = items.length > 0 ? items[items.length - 1].elo : 1500;
  const eloRange = maxElo - minElo || 1;

  const getTier = (index: number, total: number) => {
    if (total <= 1) return "S";
    const pct = index / (total - 1);
    if (pct <= 0.2) return "S";
    if (pct <= 0.4) return "A";
    if (pct <= 0.6) return "B";
    if (pct <= 0.8) return "C";
    return "D";
  };

  const tierColors: Record<string, string> = {
    S: "bg-warning-soft text-warning-text",
    A: "bg-success-soft text-success-text",
    B: "bg-accent-soft text-accent-text",
    C: "bg-elevated text-body",
    D: "bg-danger-soft text-danger-text",
  };

  if (items.length === 0) {
    return (
      <div className={emptyState}>
        <p className="text-muted">No items to rank</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const total = item.wins + item.losses + item.ties;
        const stability = Math.min(100, Math.round((total / 10) * 100));
        const tier = getTier(i, items.length);
        const barWidth =
          eloRange > 0
            ? Math.max(5, ((item.elo - minElo) / eloRange) * 100)
            : 100;

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span className="w-8 text-center text-lg font-bold text-faint">
              {i + 1}
            </span>
            <span
              className={`w-8 rounded px-1.5 py-0.5 text-center text-xs font-bold ${tierColors[tier]}`}
            >
              {tier}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-heading">{item.title}</p>
                <span className="font-mono text-xs text-faint">
                  {Math.round(item.elo)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="mt-1 flex gap-3 text-[10px] text-faint">
                <span>
                  {item.wins}W / {item.losses}L / {item.ties}T
                </span>
                <span>Stability: {stability}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
