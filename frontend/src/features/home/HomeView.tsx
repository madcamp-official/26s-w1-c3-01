import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Clock from "lucide-react/dist/esm/icons/clock";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import Users from "lucide-react/dist/esm/icons/users";
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
};

export function HomeView({
  pickData,
  historiesData,
  apiStatus,
  apiError,
  onGoPersonal,
  onGoMeeting,
  onGoHistory
}: HomeViewProps) {
  const recentMeals = historiesData.slice(0, 3);
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

      <div className="home-feature-grid">
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

      <section className="home-panel recent-panel">
        <div className="section-heading">
          <h3><Clock size={19} />최근 식사</h3>
          <button onClick={onGoHistory}>더보기 <ChevronRight size={15} /></button>
        </div>
        {recentMeals.length ? (
          <div className="recent-meal-list">
            {recentMeals.map((meal, index) => (
              <article key={meal.id ?? `${meal.date}-${meal.menu}-${index}`} className="recent-meal-card">
                <img src={meal.image} alt="" />
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
    </section>
  );
}
