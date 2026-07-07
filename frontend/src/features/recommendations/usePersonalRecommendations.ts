import { useCallback, useState } from "react";
import { mapRecommendations, type DisplayRecommendation } from "../../domain/mapper";

type StoredPersonalRecommendation = {
  menuId?: number;
  menu: string;
  score?: number;
  reason?: string;
};

export function usePersonalRecommendations() {
  const [recommendationItems, setRecommendationItems] = useState<DisplayRecommendation[]>([]);
  const [personalRecommendationReady, setPersonalRecommendationReady] = useState(false);
  const [selectedPersonalRecommendation, setSelectedPersonalRecommendation] =
    useState<DisplayRecommendation | null>(null);
  const [personalRecommendationLoading, setPersonalRecommendationLoading] = useState(false);

  const applyPersonalRecommendations = useCallback((payload: unknown) => {
    const nextRecommendations = mapRecommendations(payload);
    setRecommendationItems(nextRecommendations);
    setSelectedPersonalRecommendation(null);
    setPersonalRecommendationReady(true);
    return nextRecommendations;
  }, []);

  const restorePersonalRecommendations = useCallback(
    (storedRecommendations: StoredPersonalRecommendation[] | undefined, selectedMenuId?: number) => {
      const nextRecommendations = (storedRecommendations ?? []).map((item, index) => ({
        rank: index + 1,
        menuId: item.menuId,
        menu: item.menu,
        score: item.score ?? 0,
        category: "",
        reason: item.reason ?? ""
      }));

      if (!nextRecommendations.length) return [];

      setRecommendationItems(nextRecommendations);
      setPersonalRecommendationReady(true);
      setSelectedPersonalRecommendation(
        nextRecommendations.find((item) => item.menuId === selectedMenuId) ?? null
      );
      return nextRecommendations;
    },
    []
  );

  const clearPersonalRecommendations = useCallback(() => {
    setRecommendationItems([]);
    setSelectedPersonalRecommendation(null);
    setPersonalRecommendationReady(false);
  }, []);

  return {
    recommendationItems,
    personalRecommendationReady,
    selectedPersonalRecommendation,
    setSelectedPersonalRecommendation,
    personalRecommendationLoading,
    setPersonalRecommendationLoading,
    applyPersonalRecommendations,
    restorePersonalRecommendations,
    clearPersonalRecommendations
  };
}
