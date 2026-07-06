import { useState, type FormEvent } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import { logoAssets } from "../../assets";
import type { Flow } from "../../app/app.types";
import { SummaryLine } from "../../components/feedback/SummaryLine";
import { PickerSection, PreferenceScoreControls } from "../../components/form/PreferencePickers";
import type { PickItem } from "../../data";
import type { OAuthProvider } from "../../api/oauth.api";
import type { DisplayMeeting, PickData, PreferenceScoreMap } from "../../domain/mapper";

type AuthFlowProps = {
  flow: Flow;
  nickname: string;
  signupCredentials: SignupCredentials;
  loginCredentials: LoginCredentials;
  guestDisplayName: string;
  guestMeetingId: string;
  guestPreviewMeeting: DisplayMeeting | null;
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  categoryScores: PreferenceScoreMap;
  tagScores: PreferenceScoreMap;
  recentDuplicateDays: number;
  pickData: PickData;
  authBusy: boolean;
  authError: string;
  isOAuthOnboarding: boolean;
  onFlowChange: (flow: Flow) => void;
  onNicknameChange: (value: string) => void;
  onSignupCredentialsChange: (value: SignupCredentials) => void;
  onLoginCredentialsChange: (value: LoginCredentials) => void;
  onSelectedCategoriesChange: (value: string[]) => void;
  onSelectedTagsChange: (value: string[]) => void;
  onSelectedAllergiesChange: (value: string[]) => void;
  onCategoryScoresChange: (value: PreferenceScoreMap) => void;
  onTagScoresChange: (value: PreferenceScoreMap) => void;
  onRecentDuplicateDaysChange: (value: number) => void;
  onGuestDisplayNameChange: (value: string) => void;
  onGuestMeetingIdChange: (value: string) => void;
  onOAuthStart: (provider: OAuthProvider) => void;
  onLogin: () => Promise<void>;
  onCheckNickname: (nickname: string) => Promise<boolean>;
  onCreateEmailSignup: () => Promise<void>;
  onCompleteOAuthNickname: () => Promise<void>;
  onCompleteSignup: () => Promise<void>;
  onCompleteGuestPreferences: () => Promise<void>;
  onPreviewGuestMeeting: () => Promise<void>;
  onJoinGuestMeeting: () => Promise<void>;
};

export type SignupCredentials = {
  email: string;
  password: string;
  passwordConfirm: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export function AuthFlow({
  flow,
  nickname,
  signupCredentials,
  loginCredentials,
  selectedCategories,
  selectedTags,
  selectedAllergies,
  categoryScores,
  tagScores,
  recentDuplicateDays,
  pickData,
  authBusy,
  authError,
  isOAuthOnboarding,
  onFlowChange,
  onNicknameChange,
  onSignupCredentialsChange,
  onLoginCredentialsChange,
  onSelectedCategoriesChange,
  onSelectedTagsChange,
  onSelectedAllergiesChange,
  onCategoryScoresChange,
  onTagScoresChange,
  onRecentDuplicateDaysChange,
  guestDisplayName,
  guestMeetingId,
  guestPreviewMeeting,
  onGuestDisplayNameChange,
  onGuestMeetingIdChange,
  onOAuthStart,
  onLogin,
  onCheckNickname,
  onCreateEmailSignup,
  onCompleteOAuthNickname,
  onCompleteSignup,
  onCompleteGuestPreferences,
  onPreviewGuestMeeting,
  onJoinGuestMeeting
}: AuthFlowProps) {
  if (flow === "login") {
    return (
      <LoginScreen
        credentials={loginCredentials}
        onChange={onLoginCredentialsChange}
        onBack={() => onFlowChange("start")}
        onSubmit={onLogin}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "guest-display-name") {
    return (
      <DisplayNameStep
        displayName={guestDisplayName}
        meetingId={guestMeetingId}
        meeting={guestPreviewMeeting}
        onBack={() => onFlowChange("guest-join-meeting")}
        onChange={onGuestDisplayNameChange}
        onNext={onJoinGuestMeeting}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "guest-categories") {
    return (
      <OnboardingPickStep
        step="1/3"
        title="선호하는 카테고리를 설정해주세요"
        description="게스트 추천에 반영할 음식 계열을 골라주세요."
        items={pickData.categories}
        selected={selectedCategories}
        scores={categoryScores}
        onChange={onSelectedCategoriesChange}
        onScoreChange={onCategoryScoresChange}
        onBack={() => onFlowChange("start")}
        onNext={() => onFlowChange("guest-tags")}
      />
    );
  }

  if (flow === "guest-tags") {
    return (
      <OnboardingPickStep
        step="2/3"
        title="선호하는 조리방식을 설정해주세요"
        description="모임 추천에 반영할 취향을 골라주세요."
        items={pickData.tags}
        selected={selectedTags}
        scores={tagScores}
        onChange={onSelectedTagsChange}
        onScoreChange={onTagScoresChange}
        onBack={() => onFlowChange("guest-categories")}
        onNext={() => onFlowChange("guest-allergies")}
      />
    );
  }

  if (flow === "guest-allergies") {
    return (
      <OnboardingPickStep
        step="3/3"
        title="알러지 정보를 알려주세요"
        description="모임 추천에서 제외해야 할 항목을 선택해주세요."
        items={pickData.allergies}
        selected={selectedAllergies}
        onChange={onSelectedAllergiesChange}
        onBack={() => onFlowChange("guest-tags")}
        onNext={onCompleteGuestPreferences}
        nextLabel="완료"
        isLoading={authBusy}
        errorMessage={authError}
        danger
      />
    );
  }

  if (flow === "guest-join-meeting") {
    return (
      <GuestJoinMeetingScreen
        meetingId={guestMeetingId}
        onMeetingIdChange={onGuestMeetingIdChange}
        onBack={() => onFlowChange("guest-allergies")}
        onNext={onPreviewGuestMeeting}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "signup-name") {
    return (
      <NicknameStep
        nickname={nickname}
        credentials={signupCredentials}
        onBack={() => onFlowChange("start")}
        onChange={onNicknameChange}
        onCredentialsChange={onSignupCredentialsChange}
        onCheckNickname={onCheckNickname}
        onNext={onCreateEmailSignup}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "signup-email-sent") {
    return (
      <EmailVerificationScreen
        email={signupCredentials.email}
        onBack={() => onFlowChange("signup-name")}
        onGoLogin={() => onFlowChange("login")}
        errorMessage={authError}
      />
    );
  }

  if (flow === "oauth-nickname") {
    return (
      <OAuthNicknameStep
        nickname={nickname}
        onBack={() => onFlowChange("start")}
        onChange={onNicknameChange}
        onCheckNickname={onCheckNickname}
        onNext={onCompleteOAuthNickname}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  if (flow === "signup-categories") {
    return (
      <OnboardingPickStep
        step="1/3"
        title="선호하는 카테고리를 설정해주세요"
        description="좋아하는 음식 계열을 골라주세요."
        items={pickData.categories}
        selected={selectedCategories}
        scores={categoryScores}
        onChange={onSelectedCategoriesChange}
        onScoreChange={onCategoryScoresChange}
        onBack={() => onFlowChange(isOAuthOnboarding ? "oauth-nickname" : "signup-name")}
        onNext={() => onFlowChange("signup-tags")}
      />
    );
  }

  if (flow === "signup-tags") {
    return (
      <OnboardingPickStep
        step="2/3"
        title="선호하는 조리방식을 설정해주세요"
        description="자주 먹고 싶은 조리 방식을 골라주세요."
        items={pickData.tags}
        selected={selectedTags}
        scores={tagScores}
        onChange={onSelectedTagsChange}
        onScoreChange={onTagScoresChange}
        onBack={() => onFlowChange("signup-categories")}
        onNext={() => onFlowChange("signup-allergies")}
      />
    );
  }

  if (flow === "signup-allergies") {
    return (
      <OnboardingPickStep
        step="3/3"
        title="알러지 정보를 알려주세요"
        description="해당하는 항목을 선택해주세요."
        items={pickData.allergies}
        selected={selectedAllergies}
        onChange={onSelectedAllergiesChange}
        onBack={() => onFlowChange("signup-tags")}
        onNext={() => onFlowChange("signup-recent-penalty")}
        danger
      />
    );
  }

  if (flow === "signup-recent-penalty") {
    return (
      <RecentPenaltyStep
        days={recentDuplicateDays}
        onChange={onRecentDuplicateDaysChange}
        onBack={() => onFlowChange("signup-allergies")}
        onNext={() => onFlowChange("signup-complete")}
      />
    );
  }

  if (flow === "signup-complete") {
    return (
      <SignupCompleteScreen
        nickname={nickname}
        categories={pickData.categories.filter((item) => selectedCategories.includes(item.id)).map((item) => item.label)}
        tags={pickData.tags.filter((item) => selectedTags.includes(item.id)).map((item) => item.label)}
        allergies={pickData.allergies.filter((item) => selectedAllergies.includes(item.id)).map((item) => item.label)}
        onBack={() => onFlowChange("signup-recent-penalty")}
        onReset={() => onFlowChange("signup-categories")}
        onEnterApp={onCompleteSignup}
        isLoading={authBusy}
        errorMessage={authError}
      />
    );
  }

  return (
    <StartScreen
      onOAuthStart={onOAuthStart}
      onLoginStart={() => onFlowChange("login")}
      onSignupStart={() => onFlowChange("signup-name")}
      onGuestStart={() => onFlowChange("guest-categories")}
      isLoading={authBusy}
      errorMessage={authError}
    />
  );
}

function AuthHeader({ step, onBack }: { step?: string; onBack?: () => void }) {
  return (
    <header className="auth-header">
      {onBack ? (
        <button className="ghost-icon-button" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span />
      )}
      <img src={logoAssets.appEn} alt="MUK PICK" />
      <strong>{step}</strong>
    </header>
  );
}

function StartScreen({
  onOAuthStart,
  onLoginStart,
  onSignupStart,
  onGuestStart,
  isLoading,
  errorMessage
}: {
  onOAuthStart: (provider: OAuthProvider) => void;
  onLoginStart: () => void;
  onSignupStart: () => void;
  onGuestStart: () => void;
  isLoading: boolean;
  errorMessage: string;
}) {
  return (
    <main className="start-screen">
      <section className="start-card">
        <img src={logoAssets.startKo} alt="먹픽" className="start-logo" />
        <div className="start-copy">
          <p>오늘 뭐 먹지? 다 먹픽과 결정해요!</p>
        </div>
        <div className="social-panel">
          <div className="social-icon">
            <Sparkles size={18} />
          </div>
          <p>빠른 가입 없이 간편하게 시작하고<br />내가 고른 메뉴를 추천받아보세요.</p>
          <button className="social-button kakao" aria-label="카카오로 시작하기" onClick={() => onOAuthStart("kakao")} disabled={isLoading}>
            <span>K</span>
            카카오로 시작하기
          </button>
          <button className="social-button google" aria-label="Google로 시작하기" onClick={() => onOAuthStart("google")} disabled={isLoading}>
            <span>G</span>
            {isLoading ? "소셜 로그인 연결 중" : "Google로 시작하기"}
          </button>
          <button className="social-button signup" aria-label="일반 회원가입" onClick={onSignupStart} disabled={isLoading}>
            <span>+</span>
            일반 회원가입
          </button>
          <button className="social-button login" aria-label="이메일 로그인" onClick={onLoginStart} disabled={isLoading}>
            <span>@</span>
            이메일로 로그인
          </button>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        </div>
        <button className="guest-link" aria-label="게스트로 모임 참여하기" onClick={onGuestStart} disabled={isLoading}>
          게스트로 모임 참여하기 <ChevronRight size={14} />
        </button>
      </section>
    </main>
  );
}

function LoginScreen({
  credentials,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  errorMessage
}: {
  credentials: LoginCredentials;
  onChange: (value: LoginCredentials) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <main className="auth-screen">
      <section className="auth-card complete-card account-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo account-logo" />
        <div className="auth-copy">
          <h1>로그인</h1>
          <p>이메일과 비밀번호로 다시 시작합니다</p>
        </div>
        <form className="account-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>이메일</span>
            <input
              type="email"
              value={credentials.email}
              onChange={(event) => onChange({ ...credentials, email: event.target.value })}
              autoComplete="email"
              required
            />
          </label>
          <label className="text-field">
            <span>비밀번호</span>
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => onChange({ ...credentials, password: event.target.value })}
              autoComplete="current-password"
              required
            />
          </label>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading || !credentials.email.trim() || !credentials.password}>
            {isLoading ? "로그인 중" : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}

function DisplayNameStep({
  displayName,
  meetingId,
  meeting,
  onBack,
  onChange,
  onNext,
  isLoading,
  errorMessage
}: {
  displayName: string;
  meetingId: string;
  meeting: DisplayMeeting | null;
  onBack: () => void;
  onChange: (value: string) => void;
  onNext: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (displayName.trim()) void onNext();
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card nickname-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="nickname-logo" />
        <div className="guest-meeting-preview">
          <span>모임 ID {meetingId}</span>
          <strong>{meeting?.title ?? "초대받은 모임"}</strong>
          <small>{meeting ? `${meeting.time} · ${meeting.place}` : "모임 정보를 확인했습니다."}</small>
          <div className="member-row">
            {(meeting?.members.length ? meeting.members : [{ userId: null, name: "참여자 확인 중" }]).map((member, index) => (
              <span key={`${member.name}-${index}`}>{member.name}</span>
            ))}
          </div>
        </div>
        <form className="nickname-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <div>
              <UserRound size={18} />
              <input
                value={displayName}
                onChange={(event) => onChange(event.target.value)}
                placeholder="모임에서 보일 이름"
                maxLength={50}
              />
            </div>
            <span>위 구성원과 겹치지 않는 내 표시 이름을 입력해주세요</span>
          </label>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
          <button className="inline-next" type="submit" disabled={isLoading || !displayName.trim()} aria-label="표시 이름 다음">
            <ChevronRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

function GuestJoinMeetingScreen({
  meetingId,
  onMeetingIdChange,
  onBack,
  onNext,
  isLoading,
  errorMessage
}: {
  meetingId: string;
  onMeetingIdChange: (value: string) => void;
  onBack: () => void;
  onNext: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onNext();
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card complete-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo" />
        <div className="auth-copy">
          <h1>모임 ID 입력</h1>
          <p>초대받은 모임을 먼저 확인한 뒤 표시 이름을 입력합니다</p>
        </div>
        <form className="dialog-form guest-join-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>모임 ID</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={meetingId}
              onChange={(event) => onMeetingIdChange(event.target.value)}
              placeholder="예: 12"
              required
            />
          </label>
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading || !meetingId.trim()}>
            {isLoading ? "모임 확인 중" : "모임 확인하기"}
          </button>
        </form>
      </section>
    </main>
  );
}

function EmailVerificationScreen({
  email,
  onBack,
  onGoLogin,
  errorMessage
}: {
  email: string;
  onBack: () => void;
  onGoLogin: () => void;
  errorMessage: string;
}) {
  return (
    <main className="auth-screen">
      <section className="auth-card complete-card account-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo account-logo" />
        <div className="auth-copy">
          <h1>이메일 인증이 필요해요</h1>
          <p>{email || "입력한 이메일"}로 보낸 인증 링크를 먼저 눌러주세요.</p>
        </div>
        <div className="preference-summary-list">
          <SummaryLine label="다음 단계" values={["메일 인증", "이메일 로그인", "선호도 조사"]} emptyText="메일 인증" />
        </div>
        {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        <button className="secondary-button" onClick={onBack}>
          이메일 다시 입력
        </button>
        <button className="primary-button" onClick={onGoLogin}>
          인증 후 로그인하기
        </button>
      </section>
    </main>
  );
}

function OAuthNicknameStep({
  nickname,
  onBack,
  onChange,
  onCheckNickname,
  onNext,
  isLoading,
  errorMessage
}: {
  nickname: string;
  onBack: () => void;
  onChange: (value: string) => void;
  onCheckNickname: (nickname: string) => Promise<boolean>;
  onNext: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [localError, setLocalError] = useState("");

  const checkNickname = async () => {
    setLocalError("");
    setNicknameStatus("checking");
    const available = await onCheckNickname(nickname);
    setNicknameStatus(available ? "available" : "taken");
    return available;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nickname.trim()) {
      setLocalError("닉네임을 입력해주세요.");
      return;
    }
    if (nicknameStatus !== "available" && !(await checkNickname())) {
      return;
    }
    await onNext();
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card nickname-card account-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="nickname-logo account-logo" />
        <div className="auth-copy">
          <h1>닉네임을 정해주세요</h1>
          <p>먹픽에서 사용할 이름만 입력하면 선호도 설정으로 넘어갑니다</p>
        </div>
        <form className="account-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>닉네임</span>
            <div className="nickname-check-row">
              <div>
                <UserRound size={18} />
                <input
                  value={nickname}
                  onChange={(event) => {
                    onChange(event.target.value);
                    setNicknameStatus("idle");
                  }}
                  placeholder="nickname"
                  maxLength={50}
                  required
                />
              </div>
              <button className="secondary-button compact-check-button" type="button" onClick={() => void checkNickname()} disabled={isLoading || !nickname.trim() || nicknameStatus === "checking"}>
                {nicknameStatus === "checking" ? "확인 중" : "중복 확인"}
              </button>
            </div>
            {nicknameStatus === "available" ? <small className="field-success">사용 가능한 닉네임입니다.</small> : null}
            {nicknameStatus === "taken" ? <small className="field-error">이미 사용 중인 닉네임입니다.</small> : null}
          </label>
          {localError || errorMessage ? <p className="auth-error" role="alert">{localError || errorMessage}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading || !nickname.trim() || nicknameStatus === "taken"}>
            다음
          </button>
        </form>
      </section>
    </main>
  );
}

function NicknameStep({
  nickname,
  credentials,
  onBack,
  onChange,
  onCredentialsChange,
  onCheckNickname,
  onNext,
  isLoading,
  errorMessage
}: {
  nickname: string;
  credentials: SignupCredentials;
  onBack: () => void;
  onChange: (value: string) => void;
  onCredentialsChange: (value: SignupCredentials) => void;
  onCheckNickname: (nickname: string) => Promise<boolean>;
  onNext: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [localError, setLocalError] = useState("");

  const canSubmit =
    credentials.email.trim() &&
    credentials.password.length >= 6 &&
    credentials.password === credentials.passwordConfirm &&
    nickname.trim();

  const checkNickname = async () => {
    setLocalError("");
    setNicknameStatus("checking");
    const available = await onCheckNickname(nickname);
    setNicknameStatus(available ? "available" : "taken");
    return available;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setLocalError("이메일, 6자 이상 비밀번호, 닉네임을 모두 입력해주세요.");
      return;
    }
    if (credentials.password !== credentials.passwordConfirm) {
      setLocalError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (nicknameStatus !== "available" && !(await checkNickname())) {
      return;
    }
    await onNext();
  };

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card nickname-card account-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="nickname-logo account-logo" />
        <form className="account-form" onSubmit={handleSubmit}>
          <label className="text-field">
            <span>이메일</span>
            <input
              type="email"
              value={credentials.email}
              onChange={(event) => onCredentialsChange({ ...credentials, email: event.target.value })}
              autoComplete="email"
              required
            />
          </label>
          <label className="text-field">
            <span>비밀번호</span>
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => onCredentialsChange({ ...credentials, password: event.target.value })}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label className="text-field">
            <span>비밀번호 확인</span>
            <input
              type="password"
              value={credentials.passwordConfirm}
              onChange={(event) => onCredentialsChange({ ...credentials, passwordConfirm: event.target.value })}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label className="text-field">
            <span>닉네임</span>
            <div className="nickname-check-row">
              <div>
                <UserRound size={18} />
                <input
                  value={nickname}
                  onChange={(event) => {
                    onChange(event.target.value);
                    setNicknameStatus("idle");
                  }}
                  placeholder="nickname"
                  maxLength={50}
                  required
                />
              </div>
              <button className="secondary-button compact-check-button" type="button" onClick={() => void checkNickname()} disabled={isLoading || !nickname.trim() || nicknameStatus === "checking"}>
                {nicknameStatus === "checking" ? "확인 중" : "중복 확인"}
              </button>
            </div>
            {nicknameStatus === "available" ? <small className="field-success">사용 가능한 닉네임입니다.</small> : null}
            {nicknameStatus === "taken" ? <small className="field-error">이미 사용 중인 닉네임입니다.</small> : null}
          </label>
          {localError || errorMessage ? <p className="auth-error" role="alert">{localError || errorMessage}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading || !canSubmit || nicknameStatus === "taken"}>
            다음
          </button>
        </form>
      </section>
    </main>
  );
}

function OnboardingPickStep({
  step,
  title,
  description,
  items,
  selected,
  scores,
  onChange,
  onScoreChange,
  onBack,
  onNext,
  nextLabel = "다음",
  isLoading = false,
  errorMessage = "",
  danger = false
}: {
  step: string;
  title: string;
  description: string;
  items: PickItem[];
  selected: string[];
  scores?: PreferenceScoreMap;
  onChange: (value: string[]) => void;
  onScoreChange?: (value: PreferenceScoreMap) => void;
  onBack: () => void;
  onNext: () => void | Promise<void>;
  nextLabel?: string;
  isLoading?: boolean;
  errorMessage?: string;
  danger?: boolean;
}) {
  return (
    <main className="auth-screen onboarding-screen">
      <section className="auth-card onboarding-card">
        <AuthHeader step={step} onBack={onBack} />
        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <PickerSection title="" items={items} selected={selected} onChange={onChange} danger={danger} compact />
        {!danger && scores && onScoreChange ? (
          <PreferenceScoreControls items={items} selected={selected} scores={scores} onChange={onScoreChange} compact />
        ) : null}
        <div className="step-actions">
          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
          <button className="primary-button" onClick={() => void onNext()} disabled={isLoading}>
            {isLoading ? "저장 중" : nextLabel === "완료" ? "선택완료" : "선택완료"}
          </button>
          <button className="skip-link" onClick={() => void onNext()} disabled={isLoading}>아직 결정하지 못했어요</button>
        </div>
      </section>
    </main>
  );
}

function RecentPenaltyStep({
  days,
  onChange,
  onBack,
  onNext
}: {
  days: number;
  onChange: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const options = [1, 3, 7, 14];

  return (
    <main className="auth-screen nickname-screen">
      <section className="auth-card complete-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo" />
        <div className="auth-copy">
          <h1>{days}일</h1>
          <p>중복 식사에 대한 패널티 기간을 설정해 주세요</p>
        </div>
        <div className="penalty-options" role="radiogroup" aria-label="중복 식사 패널티 기간">
          {options.map((option) => (
            <button
              key={option}
              className={`penalty-chip ${days === option ? "selected" : ""}`}
              onClick={() => onChange(option)}
              aria-pressed={days === option}
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
            value={days}
            onChange={(event) => onChange(Math.max(0, Math.min(30, Number(event.target.value) || 0)))}
          />
        </label>
        <button className="primary-button" onClick={onNext}>
          선택완료
        </button>
      </section>
    </main>
  );
}

function SignupCompleteScreen({
  nickname,
  categories,
  tags,
  allergies,
  onBack,
  onReset,
  onEnterApp,
  isLoading,
  errorMessage
}: {
  nickname: string;
  categories: string[];
  tags: string[];
  allergies: string[];
  onBack: () => void;
  onReset: () => void;
  onEnterApp: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string;
}) {
  return (
    <main className="auth-screen">
      <section className="auth-card complete-card">
        <button className="ghost-icon-button back-floating" aria-label="이전 화면" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <img src={logoAssets.startKo} alt="먹픽" className="complete-logo" />
        <div className="auth-copy">
          <h1>{nickname || "밥"} 님</h1>
          <p>즐거운 식사에 대한 특별한 기준을 설정해 주세요</p>
        </div>
        <div className="preference-summary-list">
          <SummaryLine label="카테고리" values={categories} emptyText="선택 없음" />
          <SummaryLine label="태그" values={tags} emptyText="선택 없음" />
          <SummaryLine label="제한" values={allergies} emptyText="없음" />
        </div>
        {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}
        <button className="secondary-button" onClick={onReset} disabled={isLoading}>
          선호도 다시 설정
        </button>
        <button className="primary-button" onClick={onEnterApp} disabled={isLoading}>
          {isLoading ? "API 저장 중" : "먹픽 시작하기"}
        </button>
      </section>
    </main>
  );
}
