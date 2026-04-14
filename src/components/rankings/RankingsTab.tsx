"use client";

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
    S: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    C: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    D: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">No items to rank</p>
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
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="w-8 text-center text-lg font-bold text-gray-300 dark:text-gray-600">
              {i + 1}
            </span>
            <span
              className={`w-8 rounded px-1.5 py-0.5 text-center text-xs font-bold ${tierColors[tier]}`}
            >
              {tier}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                  {Math.round(item.elo)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="mt-1 flex gap-3 text-[10px] text-gray-400 dark:text-gray-500">
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
