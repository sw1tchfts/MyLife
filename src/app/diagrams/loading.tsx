export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-elevated" />
        <div className="h-9 w-32 rounded-md bg-elevated" />
      </div>
      <div className="h-[500px] rounded-lg bg-elevated" />
    </div>
  );
}
