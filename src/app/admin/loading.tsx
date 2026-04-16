export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-24 rounded bg-elevated" />
      <div className="flex gap-1 border-b border-border">
        <div className="h-9 w-28 rounded-t-md bg-elevated" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-32 rounded bg-elevated" />
            <div className="h-12 rounded-xl bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
