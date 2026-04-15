"use client";

import { panel } from "@/lib/styles";

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

export default function StatsTab({
  list,
}: {
  list: { items: RankingItem[]; _count: { comparisons: number } };
}) {
  const items = [...list.items].sort((a, b) => b.elo - a.elo);
  const totalComparisons = list._count.comparisons;
  const totalItems = items.length;
  const maxPossiblePairs = (totalItems * (totalItems - 1)) / 2;
  const avgComparisons =
    totalItems > 0
      ? Math.round(
          items.reduce((sum, i) => sum + i.wins + i.losses + i.ties, 0) /
            totalItems,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-heading">{totalItems}</p>
          <p className="text-xs text-faint">Items</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-heading">{totalComparisons}</p>
          <p className="text-xs text-faint">Comparisons</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-heading">{maxPossiblePairs}</p>
          <p className="text-xs text-faint">Possible Pairs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-heading">{avgComparisons}</p>
          <p className="text-xs text-faint">Avg per Item</p>
        </div>
      </div>

      <div className={panel}>
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-body">Item Statistics</h3>
        </div>
        <div className="divide-y divide-border">
          {items.map((item) => {
            const total = item.wins + item.losses + item.ties;
            const winRate =
              total > 0 ? Math.round((item.wins / total) * 100) : 0;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-heading">
                    {item.title}
                  </p>
                  <p className="text-xs text-faint">
                    Elo {Math.round(item.elo)} · {total} matchups
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-success-text">{item.wins}W</span>
                  <span className="text-danger-text">{item.losses}L</span>
                  <span className="text-muted">{item.ties}T</span>
                  <span className="font-mono font-medium text-body">
                    {winRate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
