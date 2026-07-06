import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ScreenTitle } from "../../components/navigation/ScreenTitle";
import type { DisplayRecommendation, RecommendationRefreshValue } from "../../domain/mapper";
import { RecommendationList } from "./RecommendationList";

type PersonalViewProps = {
  newMenuIncluded: boolean;
  setNewMenuIncluded: (value: boolean) => void;
  recentDuplicateDays: number;
  setRecentDuplicateDays: (value: number) => void;
  budgetMin: number | null;
  budgetMax: number | null;
  setBudgetMin: (value: number | null) => void;
  setBudgetMax: (value: number | null) => void;
  recommendationsData: DisplayRecommendation[];
  hasResults: boolean;
  isLoading: boolean;
  onRefresh: (value: RecommendationRefreshValue) => Promise<void>;
  selectedItem: DisplayRecommendation | null;
  onSelectItem: (item: DisplayRecommendation) => void;
  onFeedback: (item: DisplayRecommendation, interactionType: "like" | "dislike" | "bookmark") => void;
  onConfirmSelection: () => void;
};

export function PersonalView({
  newMenuIncluded,
  setNewMenuIncluded,
  recentDuplicateDays,
  setRecentDuplicateDays,
  budgetMin,
  budgetMax,
  setBudgetMin,
  setBudgetMax,
  recommendationsData,
  hasResults,
  isLoading,
  onRefresh,
  selectedItem,
  onSelectItem,
  onFeedback,
  onConfirmSelection
}: PersonalViewProps) {
  return (
    <section className="screen">
      <ScreenTitle title="개인 메뉴 추천" description="내 선호도, 알러지, 최근 식사 기록으로 랭킹을 만듭니다." />
      <div className="condition-panel">
        <label>
          <span>중복 식사 패널티</span>
          <select value={String(recentDuplicateDays)} onChange={(event) => setRecentDuplicateDays(Number(event.target.value))}>
            <option value="0">사용 안 함</option>
            <option value="1">1일</option>
            <option value="3">3일</option>
            <option value="7">7일</option>
            <option value="14">14일</option>
          </select>
        </label>
        <button
          className={`toggle-row ${newMenuIncluded ? "on" : ""}`}
          onClick={() => setNewMenuIncluded(!newMenuIncluded)}
          aria-pressed={newMenuIncluded}
        >
          <span>새로운 메뉴 포함</span>
          <span className="toggle-knob" />
        </button>
        <label>
          <span>예산 최소 단계</span>
          <select value={budgetMin ?? ""} onChange={(event) => setBudgetMin(readBudgetValue(event.target.value))}>
            <option value="">설정 안 함</option>
            <option value="1">1단계</option>
            <option value="2">2단계</option>
            <option value="3">3단계</option>
            <option value="4">4단계</option>
            <option value="5">5단계</option>
          </select>
        </label>
        <label>
          <span>예산 최대 단계</span>
          <select value={budgetMax ?? ""} onChange={(event) => setBudgetMax(readBudgetValue(event.target.value))}>
            <option value="">설정 안 함</option>
            <option value="1">1단계</option>
            <option value="2">2단계</option>
            <option value="3">3단계</option>
            <option value="4">4단계</option>
            <option value="5">5단계</option>
          </select>
        </label>
        <button
          className="secondary-button condition-refresh"
          onClick={() =>
            onRefresh({
              recentDuplicateDays,
              includeNewMenu: newMenuIncluded,
              budgetMin,
              budgetMax
            })
          }
          disabled={isLoading}
        >
          <Sparkles size={17} />
          {isLoading ? "추천 API 호출 중" : hasResults ? "다시 추천 받기" : "추천 받기"}
        </button>
      </div>
      {hasResults ? (
        <>
          <RecommendationList
            items={recommendationsData}
            emptyMessage="조건에 맞는 추천 결과가 없습니다."
            selectedMenuId={selectedItem?.menuId}
            onSelect={onSelectItem}
            onFeedback={onFeedback}
          />
          <div className="final-choice-bar">
            <div>
              <span>최종 선택</span>
              <strong>{selectedItem?.menu ?? "추천 메뉴를 하나 선택해 주세요"}</strong>
            </div>
            <button className="primary-button" onClick={onConfirmSelection} disabled={!selectedItem?.menuId || isLoading}>
              {isLoading ? "저장 중" : "선택 확정"}
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          title="추천 조건을 확인해 주세요"
          description="중복 식사 패널티와 새 메뉴 포함 여부를 정한 뒤 추천 받기를 누르면 랭킹을 계산합니다."
        />
      )}
    </section>
  );
}

function readBudgetValue(value: string) {
  return value ? Number(value) : null;
}
