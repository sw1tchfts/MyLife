export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-elevated" />
        <div className="h-8 w-28 rounded-md bg-elevated" />
      </div>
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center">
        <div className="h-9 w-48 rounded-md bg-elevated" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-20 rounded-t-md bg-elevated" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-elevated" />
        ))}
      </div>
    </div>
  );
}
