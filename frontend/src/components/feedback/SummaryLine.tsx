type SummaryLineProps = {
  label: string;
  values: string[];
  emptyText: string;
};

export function SummaryLine({ label, values, emptyText }: SummaryLineProps) {
  return (
    <div className="summary-line">
      <strong>{label}</strong>
      <span>{values.length ? values.join(", ") : emptyText}</span>
    </div>
  );
}
