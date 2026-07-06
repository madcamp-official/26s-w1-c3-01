import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import { ScreenTitle } from "../../components/navigation/ScreenTitle";

type ProfileViewProps = {
  profileName: string;
  onGoPreferences: () => void;
  onLogout: () => Promise<void>;
};

export function ProfileView({ profileName, onGoPreferences, onLogout }: ProfileViewProps) {
  return (
    <section className="screen">
      <ScreenTitle title="프로필" description="먹픽에서 사용할 기본 정보와 선호도를 관리합니다." />
      <section className="section-block profile-card">
        <div className="profile-avatar">
          <UserRound size={32} />
        </div>
        <strong>{profileName} 님</strong>
        <p>개인 추천과 모임 추천에 사용할 취향 정보가 저장되어 있습니다.</p>
        <button className="primary-button" onClick={onGoPreferences}>
          <SlidersHorizontal size={18} />
          선호도 관리
        </button>
        <button className="secondary-button danger-button" onClick={onLogout}>
          로그아웃
        </button>
      </section>
    </section>
  );
}
