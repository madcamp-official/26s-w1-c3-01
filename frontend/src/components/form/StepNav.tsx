type StepNavProps = {
  onBack?: () => void;
  onNext: () => void;
};

export function StepNav({ onBack, onNext }: StepNavProps) {
  return (
    <div className="step-bottom-actions">
      {onBack ? <button className="secondary-button" onClick={onBack}>이전</button> : <span />}
      <button className="primary-button" onClick={onNext}>다음</button>
    </div>
  );
}
