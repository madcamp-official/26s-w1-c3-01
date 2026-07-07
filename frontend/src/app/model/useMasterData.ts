import { useCallback, useState } from "react";
import { masterDataApi } from "../../api/masterData.api";
import {
  fallbackPickData,
  mapMeetingPurposes,
  mapMenus,
  mapPickItems,
  type MeetingPurpose,
  type PickData,
  type RemoteMenu
} from "../../domain/mapper";

export type MasterDataBundle = {
  pickData: PickData;
  menus: RemoteMenu[];
  meetingPurposes: MeetingPurpose[];
};

const MASTER_DATA_CACHE_MS = 5 * 60 * 1000;

let masterDataCache: {
  expiresAt: number;
  data: MasterDataBundle | null;
  promise: Promise<MasterDataBundle> | null;
} = {
  expiresAt: 0,
  data: null,
  promise: null
};

async function getMasterDataBundle({ force = false }: { force?: boolean } = {}) {
  const now = Date.now();
  if (!force && masterDataCache.data && masterDataCache.expiresAt > now) {
    return masterDataCache.data;
  }

  if (!force && masterDataCache.promise) {
    return masterDataCache.promise;
  }

  masterDataCache.promise = fetchMasterDataBundle().then((data) => {
    masterDataCache = {
      data,
      expiresAt: Date.now() + MASTER_DATA_CACHE_MS,
      promise: null
    };
    return data;
  }).catch((error) => {
    masterDataCache.promise = null;
    throw error;
  });

  return masterDataCache.promise;
}

async function fetchMasterDataBundle(): Promise<MasterDataBundle> {
  const [menusResult, categoriesResult, tagsResult, allergiesResult, purposesResult] = await Promise.allSettled([
    masterDataApi.listMenus(),
    masterDataApi.listMenuCategories(),
    masterDataApi.listTags(),
    masterDataApi.listAllergies(),
    masterDataApi.listMeetingPurposes()
  ]);

  const menus = menusResult.status === "fulfilled" ? mapMenus(menusResult.value) : [];
  const pickData: PickData = {
    categories:
      categoriesResult.status === "fulfilled"
        ? mapPickItems(categoriesResult.value, fallbackPickData.categories, "categories")
        : fallbackPickData.categories,
    tags:
      tagsResult.status === "fulfilled"
        ? mapPickItems(tagsResult.value, fallbackPickData.tags, "tags")
        : fallbackPickData.tags,
    allergies:
      allergiesResult.status === "fulfilled"
        ? mapPickItems(allergiesResult.value, fallbackPickData.allergies, "allergies")
        : fallbackPickData.allergies
  };
  const meetingPurposes = purposesResult.status === "fulfilled" ? mapMeetingPurposes(purposesResult.value) : [];

  return { pickData, menus, meetingPurposes };
}

export function clearMasterDataCache() {
  masterDataCache = { expiresAt: 0, data: null, promise: null };
}

export function useMasterData() {
  const [pickData, setPickData] = useState<PickData>(fallbackPickData);
  const [menuOptions, setMenuOptions] = useState<RemoteMenu[]>([]);
  const [meetingPurposes, setMeetingPurposes] = useState<MeetingPurpose[]>([]);

  const applyMasterData = useCallback((masterData: MasterDataBundle) => {
    setPickData(masterData.pickData);
    setMenuOptions(masterData.menus);
    setMeetingPurposes(masterData.meetingPurposes);
  }, []);

  const loadMasterDataOnly = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    const masterData = await getMasterDataBundle({ force });
    applyMasterData(masterData);
    return masterData;
  }, [applyMasterData]);

  return {
    pickData,
    menuOptions,
    meetingPurposes,
    applyMasterData,
    loadMasterDataOnly
  };
}
