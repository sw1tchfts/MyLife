export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-28 rounded bg-elevated" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-4">
          <div className="h-5 w-32 rounded bg-elevated" />
          <div className="space-y-2">
            <div className="h-9 w-full rounded-md bg-elevated" />
            <div className="h-9 w-full rounded-md bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}
