export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded bg-elevated" />
        <div className="h-9 w-32 rounded-md bg-elevated" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-elevated"
          />
        ))}
      </div>
    </div>
  );
}
