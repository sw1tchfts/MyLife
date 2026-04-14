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
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalItems}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Items</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalComparisons}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Comparisons
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {maxPossiblePairs}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Possible Pairs
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {avgComparisons}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Avg per Item
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Item Statistics
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Elo {Math.round(item.elo)} · {total} matchups
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-600">{item.wins}W</span>
                  <span className="text-red-500">{item.losses}L</span>
                  <span className="text-gray-400">{item.ties}T</span>
                  <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
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
