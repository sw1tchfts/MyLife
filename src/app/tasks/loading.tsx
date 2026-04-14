export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 rounded-t-md bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
      <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}
