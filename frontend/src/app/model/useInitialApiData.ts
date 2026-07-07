import { useCallback, type Dispatch, type SetStateAction } from "react";
import { mealHistoryApi } from "../../api/mealHistory.api";
import { meetingsApi } from "../../api/meetings.api";
import { preferencesApi } from "../../api/preferences.api";
import { userPreferencesApi } from "../../api/userPreferences.api";
import { usersApi } from "../../api/users.api";
import type { ApiStatus } from "../app.types";
import { errorMessage } from "../appUtils";
import { mapMeetings, type DisplayMeeting, type PickData, type RemoteMenu } from "../../domain/mapper";
import type { MasterDataBundle } from "./useMasterData";

type LoadInitialApiDataOptions = {
  syncPreferences?: boolean;
  userPayload?: unknown;
  preferencesPayload?: unknown;
};

type UseInitialApiDataValue = {
  loadMasterDataOnly: (options?: { force?: boolean }) => Promise<MasterDataBundle>;
  applyPreferences: (preferences: unknown, pickData: PickData) => void;
  applyUserPreferences: (userPreference: unknown) => void;
  applyUserPayload: (payload: unknown) => void;
  replaceMeetings: (meetings: DisplayMeeting[]) => void;
  setHistoriesFromPayload: (payload: unknown, menus?: RemoteMenu[]) => Promise<unknown>;
  clearHistories: () => void;
  setApiStatus: Dispatch<SetStateAction<ApiStatus>>;
  setApiError: Dispatch<SetStateAction<string>>;
};

export function useInitialApiData({
  loadMasterDataOnly,
  applyPreferences,
  applyUserPreferences,
  applyUserPayload,
  replaceMeetings,
  setHistoriesFromPayload,
  clearHistories,
  setApiStatus,
  setApiError
}: UseInitialApiDataValue) {
  const loadInitialApiData = useCallback(
    async ({ syncPreferences = true, userPayload, preferencesPayload }: LoadInitialApiDataOptions = {}) => {
      setApiStatus("loading");
      setApiError("");

      const masterDataPromise = loadMasterDataOnly();
      const results = await Promise.allSettled([
        syncPreferences
          ? preferencesPayload !== undefined
            ? Promise.resolve(preferencesPayload)
            : preferencesApi.getMine()
          : Promise.resolve(undefined),
        meetingsApi.list(),
        mealHistoryApi.listMine(),
        userPayload !== undefined ? Promise.resolve(userPayload) : usersApi.getMe(),
        userPreferencesApi.get()
      ]);
      const masterData = await masterDataPromise;
      const [
        preferencesResult,
        meetingsResult,
        historiesResult,
        userResult,
        userPreferenceResult
      ] = results;

      const nextMeetings = meetingsResult.status === "fulfilled" ? mapMeetings(meetingsResult.value) : [];
      replaceMeetings(nextMeetings);
      if (historiesResult.status === "fulfilled") {
        await setHistoriesFromPayload(historiesResult.value, masterData.menus);
      } else {
        clearHistories();
      }
      if (syncPreferences && preferencesResult.status === "fulfilled" && preferencesResult.value !== undefined) {
        applyPreferences(preferencesResult.value, masterData.pickData);
      }

      if (userPreferenceResult.status === "fulfilled") {
        applyUserPreferences(userPreferenceResult.value);
      }

      if (userResult.status === "fulfilled") {
        applyUserPayload(userResult.value);
      }

      const requiredResults = [
        ...(syncPreferences ? [preferencesResult] : []),
        meetingsResult,
        historiesResult,
        userResult
      ];
      const rejected = requiredResults.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        const message = errorMessage(rejected.reason);
        setApiStatus("error");
        setApiError(message);
      } else {
        setApiStatus("ready");
      }

      return {
        pickData: masterData.pickData,
        menus: masterData.menus,
        meetingPurposes: masterData.meetingPurposes,
        meetings: nextMeetings
      };
    },
    [
      applyPreferences,
      applyUserPayload,
      applyUserPreferences,
      clearHistories,
      loadMasterDataOnly,
      replaceMeetings,
      setApiError,
      setApiStatus,
      setHistoriesFromPayload
    ]
  );

  return { loadInitialApiData };
}
