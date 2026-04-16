import { emptyState } from "@/lib/styles";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className={emptyState}>
      <p className="text-muted">{title}</p>
      {description && <p className="mt-1 text-sm text-faint">{description}</p>}
    </div>
  );
}
