export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-24 rounded bg-elevated" />
      <div className="flex gap-1 border-b border-border">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-t-md bg-elevated" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-elevated" />
        ))}
      </div>
    </div>
  );
}
