import { useCallback, useState } from "react";
import {
  buildPreferencePayload,
  scoreMapFromPreferenceRows,
  selectedAllergyIdsFromPreferences,
  selectedIdsFromPreferenceRows,
  type PickData,
  type PreferenceScoreMap
} from "../../domain/mapper";

function readNullableNumber(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value === null) return null;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  }
  return null;
}

export function usePreferenceSettings() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["korean", "japanese"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["spicy", "soup"]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(["shrimp"]);
  const [categoryScores, setCategoryScores] = useState<PreferenceScoreMap>({ korean: 5, japanese: 4 });
  const [tagScores, setTagScores] = useState<PreferenceScoreMap>({ spicy: 5, soup: 4 });
  const [newMenuIncluded, setNewMenuIncluded] = useState(true);
  const [recentDuplicateDays, setRecentDuplicateDays] = useState(3);
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);

  const applyPreferences = useCallback((preferences: unknown, nextPickData: PickData) => {
    const preferenceRows = preferences as any;
    setSelectedCategories(
      selectedIdsFromPreferenceRows(preferenceRows?.categoryPreferences, nextPickData.categories, [
        "categoryId",
        "category_id",
        "id"
      ])
    );
    setCategoryScores(
      scoreMapFromPreferenceRows(preferenceRows?.categoryPreferences, nextPickData.categories, [
        "categoryId",
        "category_id",
        "id"
      ])
    );
    setSelectedTags(
      selectedIdsFromPreferenceRows(preferenceRows?.tagPreferences, nextPickData.tags, ["tagId", "tag_id", "id"])
    );
    setTagScores(scoreMapFromPreferenceRows(preferenceRows?.tagPreferences, nextPickData.tags, ["tagId", "tag_id", "id"]));
    setSelectedAllergies(selectedAllergyIdsFromPreferences(preferenceRows?.allergyIds, nextPickData.allergies));
  }, []);

  const applyUserPreferences = useCallback((userPreference: unknown) => {
    setBudgetMin(readNullableNumber(userPreference, ["budgetMin", "budget_min"]));
    setBudgetMax(readNullableNumber(userPreference, ["budgetMax", "budget_max"]));
  }, []);

  const buildCurrentPreferencePayload = useCallback(
    (pickData: PickData) =>
      buildPreferencePayload({
        selectedCategories,
        selectedTags,
        selectedAllergies,
        pickData,
        categoryScores,
        tagScores
      }),
    [categoryScores, selectedAllergies, selectedCategories, selectedTags, tagScores]
  );

  return {
    selectedCategories,
    setSelectedCategories,
    selectedTags,
    setSelectedTags,
    selectedAllergies,
    setSelectedAllergies,
    categoryScores,
    setCategoryScores,
    tagScores,
    setTagScores,
    newMenuIncluded,
    setNewMenuIncluded,
    recentDuplicateDays,
    setRecentDuplicateDays,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    applyPreferences,
    applyUserPreferences,
    buildCurrentPreferencePayload
  };
}
