import { ShieldAlert } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  compact?: boolean;
};

export function EmptyState({ title, description, compact = false }: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <ShieldAlert size={compact ? 16 : 22} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
