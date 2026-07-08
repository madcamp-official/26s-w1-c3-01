import { useCallback, type Dispatch, type SetStateAction } from "react";
import { mealHistoryApi } from "../../api/mealHistory.api";
import { menuInteractionsApi } from "../../api/menuInteractions.api";
import type { ApiStatus } from "../../app/app.types";
import { errorMessage } from "../../app/appUtils";
import type { DisplayHistory } from "../../domain/mapper";
import type { MealHistoryFormValue } from "./MealHistoryDialog";

type HistoryInteractionState = {
  preference: "like" | "dislike" | null;
  bookmarked: boolean;
};

type UseMealHistoryActionsValue = {
  historyItems: DisplayHistory[];
  mapHistoryFromPayload: (payload: unknown) => Promise<DisplayHistory | null>;
  upsertHistory: (history: DisplayHistory) => void;
  reloadHistories: () => Promise<void>;
  removeHistoryById: (historyId: number) => void;
  replaceHistories: (histories: DisplayHistory[]) => void;
  updateHistoryInteractionState: (menuId: number, state: HistoryInteractionState) => void;
  setHistorySaving: Dispatch<SetStateAction<boolean>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  showToast: (message: string) => void;
};

export function useMealHistoryActions({
  historyItems,
  mapHistoryFromPayload,
  upsertHistory,
  reloadHistories,
  removeHistoryById,
  replaceHistories,
  updateHistoryInteractionState,
  setHistorySaving,
  setApiStatus,
  setApiError,
  showToast
}: UseMealHistoryActionsValue) {
  const handleHistoryInteractionToggle = useCallback(
    async (item: DisplayHistory, interactionType: "like" | "dislike" | "bookmark") => {
      if (!item.menuId) return;

      const selected =
        interactionType === "bookmark"
          ? !item.bookmarked
          : item.preference !== interactionType;
      const previousPreference = item.preference ?? null;
      const previousBookmarked = item.bookmarked ?? false;
      const optimisticPreference =
        interactionType === "bookmark" ? previousPreference : selected ? interactionType : null;
      const optimisticBookmarked = interactionType === "bookmark" ? selected : previousBookmarked;

      updateHistoryInteractionState(item.menuId, {
        preference: optimisticPreference,
        bookmarked: optimisticBookmarked
      });

      try {
        const nextState = await menuInteractionsApi.setState(item.menuId, interactionType, selected);
        updateHistoryInteractionState(item.menuId, {
          preference: nextState.preference,
          bookmarked: nextState.bookmarked
        });
        showToast(selected ? "식사 기록 피드백을 저장했습니다." : "식사 기록 피드백을 취소했습니다.");
      } catch (error) {
        updateHistoryInteractionState(item.menuId, {
          preference: previousPreference,
          bookmarked: previousBookmarked
        });
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      }
    },
    [setApiError, setApiStatus, showToast, updateHistoryInteractionState]
  );

  const handleCreateHistory = useCallback(
    async ({ menuId, rating, memo }: MealHistoryFormValue) => {
      setHistorySaving(true);
      setApiError("");
      try {
        const created = await mealHistoryApi.create({
          menuId,
          rating,
          memo: memo.trim() || undefined,
          eatenAt: new Date().toISOString()
        });
        const nextHistory = await mapHistoryFromPayload(created);
        if (nextHistory) {
          upsertHistory(nextHistory);
        } else {
          await reloadHistories();
        }
        setApiStatus("ready");
        showToast("식사 기록을 저장했습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setHistorySaving(false);
      }
    },
    [mapHistoryFromPayload, reloadHistories, setApiError, setApiStatus, setHistorySaving, showToast, upsertHistory]
  );

  const handleUpdateHistory = useCallback(
    async (historyId: number, { menuId, rating, memo, eatenAt }: MealHistoryFormValue & { eatenAt?: string }) => {
      setHistorySaving(true);
      setApiError("");
      try {
        const updated = await mealHistoryApi.update(historyId, {
          menuId,
          rating,
          memo: memo.trim(),
          eatenAt
        });
        const nextHistory = await mapHistoryFromPayload(updated);
        if (nextHistory) {
          upsertHistory(nextHistory);
        } else {
          await reloadHistories();
        }
        setApiStatus("ready");
        showToast("식사 기록을 수정했습니다.");
      } catch (error) {
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setHistorySaving(false);
      }
    },
    [mapHistoryFromPayload, reloadHistories, setApiError, setApiStatus, setHistorySaving, showToast, upsertHistory]
  );

  const handleDeleteHistory = useCallback(
    async (historyId: number) => {
      setHistorySaving(true);
      setApiError("");
      const previousHistories = historyItems;
      removeHistoryById(historyId);
      try {
        await mealHistoryApi.remove(historyId);
        setApiStatus("ready");
        showToast("식사 기록을 삭제했습니다.");
      } catch (error) {
        replaceHistories(previousHistories);
        const message = errorMessage(error);
        setApiStatus("error");
        setApiError(message);
        showToast(message);
      } finally {
        setHistorySaving(false);
      }
    },
    [historyItems, removeHistoryById, replaceHistories, setApiError, setApiStatus, setHistorySaving, showToast]
  );

  return {
    handleHistoryInteractionToggle,
    handleCreateHistory,
    handleUpdateHistory,
    handleDeleteHistory
  };
}
