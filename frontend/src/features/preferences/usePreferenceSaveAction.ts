import { useCallback, type Dispatch, type SetStateAction } from "react";
import { preferencesApi } from "../../api/preferences.api";
import type { ApiStatus, Tab } from "../../app/app.types";
import { errorMessage } from "../../app/appUtils";
import type { PickData } from "../../domain/mapper";
import type { ReplacePreferenceRequest } from "./preference.types";

type UsePreferenceSaveActionValue = {
  pickData: PickData;
  buildCurrentPreferencePayload: (pickData: PickData) => ReplacePreferenceRequest;
  setPreferenceSaving: Dispatch<SetStateAction<boolean>>;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  showToast: (message: string) => void;
};

export function usePreferenceSaveAction({
  pickData,
  buildCurrentPreferencePayload,
  setPreferenceSaving,
  setApiStatus,
  setApiError,
  setActiveTab,
  showToast
}: UsePreferenceSaveActionValue) {
  const handlePreferenceSave = useCallback(async () => {
    setPreferenceSaving(true);
    setApiError("");
    try {
      await preferencesApi.replaceMine(buildCurrentPreferencePayload(pickData));
      setApiStatus("ready");
      showToast("선호도가 API에 저장되었습니다.");
      setActiveTab("home");
    } catch (error) {
      const message = errorMessage(error);
      setApiStatus("error");
      setApiError(message);
      showToast(message);
    } finally {
      setPreferenceSaving(false);
    }
  }, [
    buildCurrentPreferencePayload,
    pickData,
    setActiveTab,
    setApiError,
    setApiStatus,
    setPreferenceSaving,
    showToast
  ]);

  return { handlePreferenceSave };
}
