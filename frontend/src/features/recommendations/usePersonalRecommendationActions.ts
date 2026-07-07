import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { menuInteractionsApi, type MenuInteractionType } from "../../api/menuInteractions.api";
import { recommendationsApi } from "../../api/recommendations.api";
import { userPreferencesApi } from "../../api/userPreferences.api";
import type { ApiStatus, Tab } from "../../app/app.types";
import { errorMessage } from "../../app/appUtils";
import type { DisplayRecommendation, RecommendationRefreshValue } from "../../domain/mapper";
import type { MealHistoryFormValue } from "../mealHistory/MealHistoryDialog";

type UsePersonalRecommendationActionsValue = {
  selectedPersonalRecommendation: DisplayRecommendation | null;
  applyPersonalRecommendations: (payload: unknown) => DisplayRecommendation[];
  setPersonalRecommendationLoading: Dispatch<SetStateAction<boolean>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  showToast: (message: string) => void;
  createHistory: (value: MealHistoryFormValue) => Promise<void>;
};

export function usePersonalRecommendationActions({
  selectedPersonalRecommendation,
  applyPersonalRecommendations,
  setPersonalRecommendationLoading,
  setApiStatus,
  setApiError,
  setActiveTab,
  showToast,
  createHistory
}: UsePersonalRecommendationActionsValue) {
  const confirmInFlightRef = useRef(false);
  const handleRecommendationRefresh = useCallback(
    async ({ recentDuplicateDays, includeNewMenu, budgetMin, budgetMax }: RecommendationRefreshValue) => {
      setPersonalRecommendationLoading(true);
      setApiError("");
      try {
        try {
          await userPreferencesApi.update({
            budgetMin,
            budgetMax
          });
        } catch {
          // Older deployments may not support budget preferences yet.
        }

        const response = await recommendationsApi.createPersonal({
          recentDuplicateDays,
          includeNewMenu,
          limit: 6
        });
        const nextRecommendations = applyPersonalRecommendations(response);
        void Promise.allSettled(
          nextRecommendations
            .filter((item) => item.menuId)
            .map((item) => menuInteractionsApi.create(item.menuId!, "view"))
        );
        setApiStatus("ready");
        showToast("추천 API를 다시 호출했습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setPersonalRecommendationLoading(false);
      }
    },
    [
      applyPersonalRecommendations,
      setApiError,
      setApiStatus,
      setPersonalRecommendationLoading,
      showToast
    ]
  );

  const recordMenuInteraction = useCallback(
    async (item: DisplayRecommendation, interactionType: MenuInteractionType, successMessage?: string) => {
      if (!item.menuId) return;

      try {
        await menuInteractionsApi.create(item.menuId, interactionType);
        if (successMessage) showToast(successMessage);
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      }
    },
    [setApiError, setApiStatus, showToast]
  );

  const handleConfirmPersonalRecommendation = useCallback(async () => {
    if (!selectedPersonalRecommendation?.menuId) return;
    if (confirmInFlightRef.current) return;

    confirmInFlightRef.current = true;
    try {
      void recordMenuInteraction(selectedPersonalRecommendation, "pick");
      await createHistory({
        menuId: selectedPersonalRecommendation.menuId,
        rating: 5,
        memo: `${selectedPersonalRecommendation.menu} 추천 최종 선택`
      });
      setActiveTab("history");
    } finally {
      confirmInFlightRef.current = false;
    }
  }, [createHistory, recordMenuInteraction, selectedPersonalRecommendation, setActiveTab]);

  return {
    handleRecommendationRefresh,
    handleConfirmPersonalRecommendation
  };
}
