import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  History,
  Home,
  MapPin,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { logoAssets } from "./assets";
import { allergies, categories, histories, meetings, PickItem, recommendations, tags } from "./data";

type Tab = "home" | "preferences" | "personal" | "meeting" | "history";

const navItems: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "home", label: "홈", icon: Home },
  { id: "preferences", label: "선호도", icon: SlidersHorizontal },
  { id: "personal", label: "개인추천", icon: Sparkles },
  { id: "meeting", label: "모임", icon: Users },
  { id: "history", label: "기록", icon: History }
];

export function App() {
  const [started, setStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["korean", "japanese"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["spicy", "soup"]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["shrimp"]);
  const [newMenuIncluded, setNewMenuIncluded] = useState(true);

  const tasteSummary = useMemo(() => {
    const categoryCount = selectedCategories.length;
    const tagCount = selectedTags.length;
    const allergyCount = selectedAllergies.length;
    return { categoryCount, tagCount, allergyCount };
  }, [selectedCategories, selectedTags, selectedAllergies]);

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return (
    <div className="app-shell">
      <main className="phone-frame">
        <header className="app-header">
          <img src={logoAssets.appEn} alt="MUK PICK" className="app-logo" />
          <button className="icon-action" aria-label="선호도 빠른 설정" onClick={() => setActiveTab("preferences")}>
            <SlidersHorizontal size={18} />
          </button>
        </header>

        {activeTab === "home" && (
          <HomeView
            summary={tasteSummary}
            onGoPersonal={() => setActiveTab("personal")}
            onGoMeeting={() => setActiveTab("meeting")}
            onGoPreferences={() => setActiveTab("preferences")}
          />
        )}

        {activeTab === "preferences" && (
          <PreferencesView
            selectedCategories={selectedCategories}
            selectedTags={selectedTags}
            selectedAllergies={selectedAllergies}
            setSelectedCategories={setSelectedCategories}
            setSelectedTags={setSelectedTags}
            setSelectedAllergies={setSelectedAllergies}
          />
        )}

        {activeTab === "personal" && (
          <PersonalView newMenuIncluded={newMenuIncluded} setNewMenuIncluded={setNewMenuIncluded} />
        )}

        {activeTab === "meeting" && <MeetingView />}

        {activeTab === "history" && <HistoryView />}

        <nav className="bottom-nav" aria-label="하단 메뉴">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
      </main>
    </div>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="start-screen">
      <section className="start-card">
        <img src={logoAssets.startKo} alt="먹픽" className="start-logo" />
        <div className="start-copy">
          <h1>오늘 뭐 먹지?</h1>
          <p>취향, 알레르기, 모임 조건을 모아 가장 덜 고민되는 메뉴를 추천합니다.</p>
        </div>
        <div className="start-actions">
          <button className="primary-button" onClick={onStart}>
            <Sparkles size={18} />
            추천 시작
          </button>
          <button className="secondary-button" onClick={onStart}>로그인으로 계속</button>
        </div>
      </section>
    </main>
  );
}

function HomeView({
  summary,
  onGoPersonal,
  onGoMeeting,
  onGoPreferences
}: {
  summary: { categoryCount: number; tagCount: number; allergyCount: number };
  onGoPersonal: () => void;
  onGoMeeting: () => void;
  onGoPreferences: () => void;
}) {
  return (
    <section className="screen">
      <div className="hero-panel">
        <div>
          <p className="today-label">MUK PICK</p>
          <h2>취향을 모아서 메뉴 결정을 빠르게</h2>
          <p>개인 추천과 모임 추천을 같은 선호도 데이터로 이어갑니다.</p>
        </div>
        <div className="summary-strip">
          <span>카테고리 {summary.categoryCount}</span>
          <span>태그 {summary.tagCount}</span>
          <span>제한 {summary.allergyCount}</span>
        </div>
      </div>

      <div className="quick-actions">
        <button className="action-tile primary-tile" onClick={onGoPersonal}>
          <Sparkles size={22} />
          <span>개인 추천</span>
          <small>지금 먹을 메뉴 찾기</small>
        </button>
        <button className="action-tile" onClick={onGoMeeting}>
          <Users size={22} />
          <span>모임 추천</span>
          <small>참여자 취향 합치기</small>
        </button>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <h3>오늘의 추천 후보</h3>
          <button onClick={onGoPersonal}>전체 보기</button>
        </div>
        <RecommendationList compact />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h3>선호도 준비 상태</h3>
          <button onClick={onGoPreferences}>수정</button>
        </div>
        <div className="readiness">
          <div>
            <Check size={18} />
            <span>카테고리와 태그 입력 완료</span>
          </div>
          <div>
            <ShieldAlert size={18} />
            <span>알레르기 제한 조건 반영</span>
          </div>
        </div>
      </section>
    </section>
  );
}

function PreferencesView({
  selectedCategories,
  selectedTags,
  selectedAllergies,
  setSelectedCategories,
  setSelectedTags,
  setSelectedAllergies
}: {
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  setSelectedCategories: (value: string[]) => void;
  setSelectedTags: (value: string[]) => void;
  setSelectedAllergies: (value: string[]) => void;
}) {
  return (
    <section className="screen">
      <ScreenTitle title="선호도 설정" description="좋아하는 음식 계열과 피해야 할 조건을 선택하세요." />
      <PickerSection
        title="음식 카테고리"
        items={categories}
        selected={selectedCategories}
        onChange={setSelectedCategories}
      />
      <PickerSection title="조리 방식 / 취향 태그" items={tags} selected={selectedTags} onChange={setSelectedTags} />
      <PickerSection
        title="알레르기 / 제한 조건"
        items={allergies}
        selected={selectedAllergies}
        onChange={setSelectedAllergies}
        danger
      />
      <button className="sticky-save">
        <Check size={18} />
        선호도 저장
      </button>
    </section>
  );
}

function PickerSection({
  title,
  items,
  selected,
  onChange,
  danger = false
}: {
  title: string;
  items: PickItem[];
  selected: string[];
  onChange: (value: string[]) => void;
  danger?: boolean;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <section className="picker-section">
      <h3>{title}</h3>
      <div className="asset-grid">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              className={`asset-card ${isSelected ? "selected" : ""} ${danger ? "danger-card" : ""}`}
              onClick={() => toggle(item.id)}
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

function PersonalView({
  newMenuIncluded,
  setNewMenuIncluded
}: {
  newMenuIncluded: boolean;
  setNewMenuIncluded: (value: boolean) => void;
}) {
  return (
    <section className="screen">
      <ScreenTitle title="개인 메뉴 추천" description="식사 목적과 최근 기록을 반영해 랭킹을 만듭니다." />
      <div className="condition-panel">
        <label>
          <span>식사 목적</span>
          <select defaultValue="casual">
            <option value="casual">가벼운 한 끼</option>
            <option value="team">팀 식사</option>
            <option value="new">새로운 메뉴 탐색</option>
          </select>
        </label>
        <label>
          <span>최근 메뉴 제외</span>
          <select defaultValue="3">
            <option value="1">1일</option>
            <option value="3">3일</option>
            <option value="7">7일</option>
          </select>
        </label>
        <button
          className={`toggle-row ${newMenuIncluded ? "on" : ""}`}
          onClick={() => setNewMenuIncluded(!newMenuIncluded)}
        >
          <span>새로운 메뉴 포함</span>
          <span className="toggle-knob" />
        </button>
      </div>
      <RecommendationList />
    </section>
  );
}

function MeetingView() {
  return (
    <section className="screen">
      <ScreenTitle title="모임 추천" description="참여자 조건을 모아 모두가 수용하기 쉬운 메뉴를 찾습니다." />
      <button className="create-meeting">
        <Plus size={19} />
        새 모임 만들기
      </button>
      <div className="meeting-list">
        {meetings.map((meeting) => (
          <article className="meeting-card" key={meeting.title}>
            <div className="meeting-topline">
              <strong>{meeting.title}</strong>
              <span>{meeting.status}</span>
            </div>
            <div className="meeting-meta">
              <span>
                <Clock size={15} />
                {meeting.time}
              </span>
              <span>
                <MapPin size={15} />
                {meeting.place}
              </span>
            </div>
            <div className="member-row">
              {meeting.members.map((member) => (
                <span key={member}>{member}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <section className="section-block group-result">
        <div className="section-heading">
          <h3>집단 추천 미리보기</h3>
        </div>
        <RecommendationList compact />
      </section>
    </section>
  );
}

function HistoryView() {
  return (
    <section className="screen">
      <ScreenTitle title="식사 기록" description="선택한 메뉴는 이후 추천에서 반복을 줄이는 데 사용됩니다." />
      <div className="history-timeline">
        {histories.map((history) => (
          <article className="history-row" key={`${history.date}-${history.menu}`}>
            <time>{history.date}</time>
            <div>
              <strong>{history.menu}</strong>
              <span>{history.memo}</span>
            </div>
            <Star size={17} />
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendationList({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`recommendation-list ${compact ? "compact" : ""}`}>
      {recommendations.map((item) => (
        <article className="recommendation-card" key={item.menu}>
          <div className="rank-mark">{item.rank}</div>
          <div className="recommendation-body">
            <div className="recommendation-title">
              <strong>{item.menu}</strong>
              <span>{item.score}점</span>
            </div>
            <p>{item.reason}</p>
            <div className="tag-row">
              <span>{item.category}</span>
              <span>추천 이유 보기</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ScreenTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="screen-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick
}: {
  item: { id: Tab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={19} />
      <span>{item.label}</span>
    </button>
  );
}
