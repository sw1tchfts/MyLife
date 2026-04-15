export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-elevated" />
        <div className="h-9 w-28 rounded-md bg-elevated" />
      </div>
      <div className="flex gap-1 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 rounded-t-md bg-elevated"
          />
        ))}
      </div>
      <div className="h-10 rounded-md bg-elevated" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-elevated"
          />
        ))}
      </div>
    </div>
  );
}
