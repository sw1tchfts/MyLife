export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-36 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 rounded-t-md bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}
