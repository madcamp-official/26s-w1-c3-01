import { useCallback, useState } from "react";
import { mealHistoryApi } from "../../api/mealHistory.api";
import { menuInteractionsApi, type MenuInteractionState } from "../../api/menuInteractions.api";
import { mapHistory, mapHistories, type DisplayHistory, type RemoteMenu } from "../../domain/mapper";

type HistoryInteractionState = Pick<MenuInteractionState, "preference" | "bookmarked">;

function sortHistoriesByDate(histories: DisplayHistory[]) {
  return [...histories].sort((left, right) => {
    const leftTime = left.eatenAt ? new Date(left.eatenAt).getTime() : 0;
    const rightTime = right.eatenAt ? new Date(right.eatenAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function useMealHistories(menuOptions: RemoteMenu[]) {
  const [historyItems, setHistoryItems] = useState<DisplayHistory[]>([]);

  const decorateHistoriesWithInteractions = useCallback(async (histories: DisplayHistory[]) => {
    const menuIds = Array.from(
      new Set(histories.map((history) => history.menuId).filter((menuId): menuId is number => Boolean(menuId)))
    );
    if (!menuIds.length) return histories;

    const interactionStates = await menuInteractionsApi.listMine(menuIds);
    const interactionStateMap = new Map(interactionStates.map((state) => [state.menuId, state]));

    return histories.map((history) => {
      const state = history.menuId ? interactionStateMap.get(history.menuId) : undefined;
      return {
        ...history,
        preference: state?.preference ?? null,
        bookmarked: state?.bookmarked ?? false
      };
    });
  }, []);

  const setHistoriesFromPayload = useCallback(
    async (payload: unknown, menus: RemoteMenu[] = menuOptions) => {
      const nextHistories = mapHistories(payload, menus);
      try {
        setHistoryItems(await decorateHistoriesWithInteractions(nextHistories));
      } catch {
        setHistoryItems(nextHistories);
      }
      return nextHistories;
    },
    [decorateHistoriesWithInteractions, menuOptions]
  );

  const reloadHistories = useCallback(async () => {
    await setHistoriesFromPayload(await mealHistoryApi.listMine());
  }, [setHistoriesFromPayload]);

  const mapHistoryFromPayload = useCallback(
    async (payload: unknown) => {
      const history = mapHistory(payload, menuOptions);
      if (!history) return null;

      try {
        const [decorated] = await decorateHistoriesWithInteractions([history]);
        return decorated ?? history;
      } catch {
        return history;
      }
    },
    [decorateHistoriesWithInteractions, menuOptions]
  );

  const upsertHistory = useCallback((history: DisplayHistory) => {
    setHistoryItems((current) => {
      const exists = typeof history.id === "number" && current.some((item) => item.id === history.id);
      const next = exists
        ? current.map((item) => (item.id === history.id ? { ...item, ...history } : item))
        : [history, ...current];
      return sortHistoriesByDate(next);
    });
  }, []);

  const clearHistories = useCallback(() => {
    setHistoryItems([]);
  }, []);

  const replaceHistories = useCallback((histories: DisplayHistory[]) => {
    setHistoryItems(histories);
  }, []);

  const removeHistoryById = useCallback((historyId: number) => {
    setHistoryItems((current) => current.filter((history) => history.id !== historyId));
  }, []);

  const updateHistoryInteractionState = useCallback((menuId: number, state: HistoryInteractionState) => {
    setHistoryItems((current) =>
      current.map((history) =>
        history.menuId === menuId
          ? {
              ...history,
              preference: state.preference,
              bookmarked: state.bookmarked
            }
          : history
      )
    );
  }, []);

  return {
    historyItems,
    setHistoriesFromPayload,
    reloadHistories,
    mapHistoryFromPayload,
    upsertHistory,
    clearHistories,
    replaceHistories,
    removeHistoryById,
    updateHistoryInteractionState
  };
}
