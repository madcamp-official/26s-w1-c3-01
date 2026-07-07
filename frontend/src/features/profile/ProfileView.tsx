import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import { Page } from "../../components/layout/Page";
import { PageGrid } from "../../components/layout/PageGrid";

type ProfileViewProps = {
  profileName: string;
  preferenceCount: number;
  historyCount: number;
  onGoPreferences: () => void;
  onLogout: () => Promise<void>;
};

export function ProfileView({ profileName, preferenceCount, historyCount, onGoPreferences, onLogout }: ProfileViewProps) {
  return (
    <Page className="profile-screen" title="프로필" description="먹픽에서 사용할 기본 정보와 선호도를 관리합니다.">
      <PageGrid className="profile-dashboard">
        <article className="section-block profile-card">
          <div className="profile-avatar">
            <UserRound size={32} />
          </div>
          <strong>{profileName} 님</strong>
          <p>개인 추천과 모임 추천에 사용할 취향 정보가 저장되어 있습니다.</p>
        </article>

        <article className="section-block profile-stat-card">
          <span>선호도 상태</span>
          <strong>{preferenceCount}개 항목</strong>
          <p>카테고리, 태그, 제한 조건을 기준으로 추천이 계산됩니다.</p>
          <button className="primary-button" onClick={onGoPreferences}>
            <SlidersHorizontal size={18} />
            선호도 관리
          </button>
        </article>

        <article className="section-block profile-stat-card">
          <span>식사 기록</span>
          <strong>{historyCount}개 기록</strong>
          <p>최근 식사 기록은 반복 추천을 줄이는 데 사용됩니다.</p>
        </article>

        <article className="section-block profile-stat-card account-card-panel">
          <span>계정 관리</span>
          <strong>로그인 세션</strong>
          <p>현재 계정에서 로그아웃합니다.</p>
          <button className="secondary-button danger-button" onClick={onLogout}>
            로그아웃
          </button>
        </article>
      </PageGrid>
    </Page>
  );
}
