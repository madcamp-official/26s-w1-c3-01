import Check from "lucide-react/dist/esm/icons/check";
import type { PickItem } from "../../data";
import type { PreferenceScoreMap } from "../../domain/mapper";

type PickerSectionProps = {
  title: string;
  items: PickItem[];
  selected: string[];
  onChange: (value: string[]) => void;
  danger?: boolean;
  compact?: boolean;
};

export function PickerSection({
  title,
  items,
  selected,
  onChange,
  danger = false,
  compact = false
}: PickerSectionProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <section className={`picker-section ${compact ? "compact-picker" : ""} ${danger ? "danger-picker" : ""}`}>
      {title ? <h3>{title}</h3> : null}
      <div className="asset-grid">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              className={`asset-card ${isSelected ? "selected" : ""} ${danger ? "danger-card" : ""}`}
              onClick={() => toggle(item.id)}
              aria-pressed={isSelected}
            >
              <span className="check-dot">{isSelected && <Check size={14} />}</span>
              <img src={item.image} alt="" />
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type PreferenceScoreControlsProps = {
  items: PickItem[];
  selected: string[];
  scores: PreferenceScoreMap;
  onChange: (value: PreferenceScoreMap) => void;
  compact?: boolean;
};

export function PreferenceScoreControls({
  items,
  selected,
  scores,
  onChange,
  compact = false
}: PreferenceScoreControlsProps) {
  const selectedItems = selected
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is PickItem => Boolean(item));

  if (!selectedItems.length) return null;

  const updateScore = (id: string, value: number) => {
    onChange({ ...scores, [id]: Math.max(0, Math.min(5, Math.round(value))) });
  };

  return (
    <section className={`score-section ${compact ? "compact-score-section" : ""}`} aria-label="선호 점수 조정">
      {selectedItems.map((item) => {
        const score = scores[item.id] ?? 5;
        return (
          <div className="score-row" key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <span>{score}점</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={score}
              aria-label={`${item.label} 선호 점수`}
              onChange={(event) => updateScore(item.id, Number(event.target.value))}
            />
          </div>
        );
      })}
    </section>
  );
}
