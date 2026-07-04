import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { PreferenceOnboardingPage } from "../features/onboarding/PreferenceOnboardingPage";
import { PreferencePage } from "../features/preferences/PreferencePage";
import { PersonalRecommendationPage } from "../features/recommendations/PersonalRecommendationPage";
import { MeetingListPage } from "../features/meetings/MeetingListPage";
import { MeetingCreatePage } from "../features/meetings/MeetingCreatePage";
import { MeetingDetailPage } from "../features/meetings/MeetingDetailPage";
import { MealHistoryPage } from "../features/mealHistory/MealHistoryPage";
import { MenuListPage } from "../features/masterData/MenuListPage";
import { MenuDetailPage } from "../features/masterData/MenuDetailPage";
import { MyPage } from "../features/user/MyPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/recommendations/personal" replace />} />
        <Route path="/onboarding/preferences" element={<PreferenceOnboardingPage />} />
        <Route path="/preferences" element={<PreferencePage />} />
        <Route path="/recommendations/personal" element={<PersonalRecommendationPage />} />
        <Route path="/meetings" element={<MeetingListPage />} />
        <Route path="/meetings/new" element={<MeetingCreatePage />} />
        <Route path="/meetings/:meetingId" element={<MeetingDetailPage />} />
        <Route path="/meal-history" element={<MealHistoryPage />} />
        <Route path="/menus" element={<MenuListPage />} />
        <Route path="/menus/:menuId" element={<MenuDetailPage />} />
        <Route path="/me" element={<MyPage />} />
      </Route>
    </Routes>
  );
}
