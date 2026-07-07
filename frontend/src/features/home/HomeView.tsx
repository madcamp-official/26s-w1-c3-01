import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Clock from "lucide-react/dist/esm/icons/clock";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import Heart from "lucide-react/dist/esm/icons/heart";
import Star from "lucide-react/dist/esm/icons/star";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import Users from "lucide-react/dist/esm/icons/users";
import type { ReactNode } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import type { ApiStatus } from "../../app/app.types";
import { fallbackPickData, type DisplayHistory, type PickData } from "../../domain/mapper";

type HomeViewProps = {
  pickData: PickData;
  historiesData: DisplayHistory[];
  apiStatus: ApiStatus;
  apiError: string;
  onGoPersonal: () => void;
  onGoMeeting: () => void;
  onGoHistory: () => void;
  selectedCategoryIds: string[];
  selectedTagIds: string[];
  meetingCount: number;
};

export function HomeView({
  pickData,
  historiesData,
  apiStatus,
  apiError,
  onGoPersonal,
  onGoMeeting,
  onGoHistory,
  selectedCategoryIds,
  selectedTagIds,
  meetingCount: _meetingCount
}: HomeViewProps) {
  const recentMeals = historiesData.slice(0, 4);
  const selectedCategoryLabels = pickData.categories
    .filter((item) => selectedCategoryIds.includes(item.id))
    .map((item) => item.label)
    .slice(0, 3);
  const selectedTagLabels = pickData.tags
    .filter((item) => selectedTagIds.includes(item.id))
    .map((item) => item.label)
    .slice(0, 3);
  const weeklyMealCount = countThisWeek(historiesData);
  const favoriteSummary = selectedCategoryLabels.length
    ? selectedCategoryLabels.join(", ")
    : selectedTagLabels.length
      ? selectedTagLabels.join(", ")
      : "미설정";
  const averageRating = formatAverageRating(historiesData);
  const personalImage = pickData.categories[1]?.image ?? fallbackPickData.categories[1].image;
  const collageImages = [
    pickData.categories[2]?.image ?? fallbackPickData.categories[2].image,
    pickData.tags[6]?.image ?? fallbackPickData.tags[6].image,
    pickData.categories[5]?.image ?? fallbackPickData.categories[5].image
  ];

  return (
    <section className="screen home-screen">
      {apiStatus === "loading" ? <div className="api-banner">백엔드 API에서 데이터를 불러오는 중입니다.</div> : null}
      {apiStatus === "error" && apiError ? <div className="api-banner error">{apiError}</div> : null}

      <div className="home-title">
        <h2>오늘은 뭘 먹어볼까요?</h2>
        <span>취향과 상황에 맞는 메뉴를 쉽고 빠르게 추천받아보세요!</span>
      </div>

      <div className="home-dashboard">
        <div className="home-main-actions">
          <button className="home-choice-card personal-choice" onClick={onGoPersonal}>
            <span className="choice-icon personal-icon"><UserRound size={26} /></span>
            <strong>개인 메뉴 추천</strong>
            <small>내 취향과 상황에 맞는 메뉴를 추천해드려요</small>
            <img src={personalImage} alt="" />
            <span className="round-arrow"><ArrowRight size={24} /></span>
          </button>
          <button className="home-choice-card meeting-choice" onClick={onGoMeeting}>
            <span className="choice-icon meeting-icon"><Users size={27} /></span>
            <strong>모임 생성</strong>
            <small>모임을 만들고 함께 메뉴를 정해보세요</small>
            <div className="choice-collage">
              {collageImages.map((image) => (
                <img src={image} alt="" key={image} />
              ))}
            </div>
            <span className="round-arrow green"><ArrowRight size={24} /></span>
          </button>
        </div>

        <aside className="home-side-panels">
          <section className="home-panel recent-panel">
            <div className="section-heading">
              <h3><Clock size={19} />최근 식사</h3>
              <button onClick={onGoHistory}>더보기 <ChevronRight size={15} /></button>
            </div>
            {recentMeals.length ? (
              <div className="recent-meal-list">
                {recentMeals.map((meal, index) => (
                  <article key={meal.id ?? `${meal.date}-${meal.menu}-${index}`} className="recent-meal-card">
                    <img
                      src={meal.image}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackPickData.categories[0].image;
                      }}
                    />
                    <div>
                      <strong>{meal.menu}</strong>
                      <span>{meal.date} · {meal.memo}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="최근 식사가 없습니다" description="식사 기록 API가 아직 빈 목록을 반환했습니다." compact />
            )}
          </section>

          <section className="home-panel my-summary-panel">
            <div className="section-heading">
              <h3>나의 요약</h3>
            </div>
            <div className="home-insight-list">
              <HomeInsightRow
                icon={<Clock3 size={18} />}
                tone="coral"
                label="이번 주 식사 기록"
                value={`${weeklyMealCount}회`}
              />
              <HomeInsightRow
                icon={<Heart size={18} />}
                tone="red"
                label="선호 메뉴 TOP 3"
                value={favoriteSummary}
              />
              <HomeInsightRow
                icon={<Star size={18} />}
                tone="yellow"
                label="평균 만족도"
                value={averageRating}
              />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function HomeInsightRow({
  icon,
  tone,
  label,
  value
}: {
  icon: ReactNode;
  tone: "coral" | "red" | "yellow";
  label: string;
  value: string;
}) {
  return (
    <div className="home-insight-row">
      <span className={`home-insight-icon ${tone}`}>{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function countThisWeek(histories: DisplayHistory[]) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day + 1);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return histories.filter((history) => {
    if (!history.eatenAt) return false;
    const eatenAt = new Date(history.eatenAt);
    return eatenAt >= start && eatenAt < end;
  }).length;
}

function formatAverageRating(histories: DisplayHistory[]) {
  const ratings = histories
    .map((history) => history.rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));

  if (!ratings.length) return "- / 5.0";

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return `${average.toFixed(1)} / 5.0`;
}
