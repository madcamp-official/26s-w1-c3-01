import { useState } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import { SummaryLine } from "../../components/feedback/SummaryLine";
import { PickerSection, PreferenceScoreControls } from "../../components/form/PreferencePickers";
import { StepNav } from "../../components/form/StepNav";
import { Page } from "../../components/layout/Page";
import { PageGrid } from "../../components/layout/PageGrid";
import { PageHeader } from "../../components/layout/PageHeader";
import type { PickData, PreferenceScoreMap } from "../../domain/mapper";

type PreferencesViewProps = {
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  categoryScores: PreferenceScoreMap;
  tagScores: PreferenceScoreMap;
  recentDuplicateDays: number;
  pickData: PickData;
  isSaving: boolean;
  setSelectedCategories: (value: string[]) => void;
  setSelectedTags: (value: string[]) => void;
  setSelectedAllergies: (value: string[]) => void;
  setCategoryScores: (value: PreferenceScoreMap) => void;
  setTagScores: (value: PreferenceScoreMap) => void;
  setRecentDuplicateDays: (value: number) => void;
  onSave: () => Promise<void>;
};

export function PreferencesView({
  selectedCategories,
  selectedTags,
  selectedAllergies,
  categoryScores,
  tagScores,
  recentDuplicateDays,
  pickData,
  isSaving,
  setSelectedCategories,
  setSelectedTags,
  setSelectedAllergies,
  setCategoryScores,
  setTagScores,
  setRecentDuplicateDays,
  onSave
}: PreferencesViewProps) {
  const [step, setStep] = useState<"categories" | "tags" | "allergies" | "penalty" | "confirm">("categories");
  const options = [1, 3, 7, 14];

  const stepMeta = {
    categories: { title: "카테고리 설정", description: "좋아하는 음식 계열을 선택하고 점수를 조정하세요.", index: "1/5" },
    tags: { title: "태그 설정", description: "선호하는 조리 방식과 취향을 선택하세요.", index: "2/5" },
    allergies: { title: "제한 조건", description: "피해야 할 알러지나 재료를 선택하세요.", index: "3/5" },
    penalty: { title: "중복 식사 패널티", description: "최근 며칠 안에 먹은 메뉴를 덜 추천할지 정하세요.", index: "4/5" },
    confirm: { title: "저장 전 확인", description: "선택한 선호도를 확인하고 저장하세요.", index: "5/5" }
  }[step];
  const steps = [
    { id: "categories", label: "카테고리" },
    { id: "tags", label: "태그" },
    { id: "allergies", label: "제한 조건" },
    { id: "penalty", label: "중복 패널티" },
    { id: "confirm", label: "확인" }
  ] as const;
  const summary = (
    <div className="preference-summary-list">
      <SummaryLine label="카테고리" values={pickData.categories.filter((item) => selectedCategories.includes(item.id)).map((item) => item.label)} emptyText="선택 없음" />
      <SummaryLine label="태그" values={pickData.tags.filter((item) => selectedTags.includes(item.id)).map((item) => item.label)} emptyText="선택 없음" />
      <SummaryLine label="제한" values={pickData.allergies.filter((item) => selectedAllergies.includes(item.id)).map((item) => item.label)} emptyText="없음" />
      <SummaryLine label="중복" values={[`${recentDuplicateDays}일`]} emptyText="사용 안 함" />
    </div>
  );

  return (
    <Page className="preferences-screen">
      <div className="step-screen-heading">
        <strong>{stepMeta.index}</strong>
        <PageHeader title={stepMeta.title} description={stepMeta.description} />
      </div>

      <PageGrid className="preferences-layout">
        <aside className="preference-stepper" aria-label="선호도 설정 단계">
          {steps.map((item, index) => (
            <button
              key={item.id}
              className={step === item.id ? "active" : ""}
              onClick={() => setStep(item.id)}
              type="button"
            >
              <span>{index + 1}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="preference-step-content">
          {step === "categories" ? (
            <>
              <PickerSection title="" items={pickData.categories} selected={selectedCategories} onChange={setSelectedCategories} compact />
              <PreferenceScoreControls items={pickData.categories} selected={selectedCategories} scores={categoryScores} onChange={setCategoryScores} compact />
              <StepNav onNext={() => setStep("tags")} />
            </>
          ) : null}
          {step === "tags" ? (
            <>
              <PickerSection title="" items={pickData.tags} selected={selectedTags} onChange={setSelectedTags} compact />
              <PreferenceScoreControls items={pickData.tags} selected={selectedTags} scores={tagScores} onChange={setTagScores} compact />
              <StepNav onBack={() => setStep("categories")} onNext={() => setStep("allergies")} />
            </>
          ) : null}
          {step === "allergies" ? (
            <>
              <PickerSection title="" items={pickData.allergies} selected={selectedAllergies} onChange={setSelectedAllergies} danger compact />
              <StepNav onBack={() => setStep("tags")} onNext={() => setStep("penalty")} />
            </>
          ) : null}
          {step === "penalty" ? (
            <>
              <section className="section-block penalty-manage-panel">
                <div className="penalty-options" role="radiogroup" aria-label="중복 식사 패널티 기간">
                  {options.map((option) => (
                    <button
                      key={option}
                      className={`penalty-chip ${recentDuplicateDays === option ? "selected" : ""}`}
                      onClick={() => setRecentDuplicateDays(option)}
                      aria-pressed={recentDuplicateDays === option}
                    >
                      {option}일
                    </button>
                  ))}
                </div>
                <label className="text-field penalty-input">
                  <span>직접 입력</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={recentDuplicateDays}
                    onChange={(event) => setRecentDuplicateDays(Math.max(0, Math.min(30, Number(event.target.value) || 0)))}
                  />
                </label>
              </section>
              <StepNav onBack={() => setStep("allergies")} onNext={() => setStep("confirm")} />
            </>
          ) : null}
          {step === "confirm" ? (
            <>
              {summary}
              <div className="step-bottom-actions">
                <button className="secondary-button" onClick={() => setStep("penalty")}>이전</button>
                <button className="primary-button" onClick={onSave} disabled={isSaving}>
                  <Check size={18} />
                  {isSaving ? "API 저장 중" : "선호도 저장"}
                </button>
              </div>
            </>
          ) : null}
        </main>

        <aside className="preference-summary-aside">
          <h3>선택 요약</h3>
          {summary}
          <button className="primary-button" onClick={onSave} disabled={isSaving}>
            <Check size={18} />
            {isSaving ? "저장 중" : "선호도 저장"}
          </button>
        </aside>
      </PageGrid>
    </Page>
  );
}
