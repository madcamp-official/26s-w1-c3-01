import {
  allergies as fallbackAllergies,
  categories as fallbackCategories,
  tags as fallbackTags,
  type PickItem
} from "../data";
import { menuAsset } from "../assets";

export type ApiPickItem = PickItem & { apiId?: number };

export type PickData = {
  categories: ApiPickItem[];
  tags: ApiPickItem[];
  allergies: ApiPickItem[];
};

export type RemoteMenu = {
  menuId: number;
  name: string;
  categoryName?: string;
  image?: string;
};

export type DisplayRecommendation = {
  rank: number;
  menuId?: number;
  menu: string;
  score: number;
  category: string;
  reason: string;
  image?: string;
  scores?: RecommendationScoreBreakdown;
};

export type DisplayMember = {
  userId: number | null;
  name: string;
};

export type DisplayMeeting = {
  id?: number;
  title: string;
  status: string;
  createdBy?: number;
  creatorNickname?: string;
  meetingPurposeId?: number;
  meetingTime?: string;
  selectedMenuId?: number | null;
  time: string;
  place: string;
  members: DisplayMember[];
};

type SortableDisplayMeeting = DisplayMeeting & { rawTime: string };

export type UserOption = {
  userId: number;
  nickname: string;
  email?: string;
};

export type DisplayHistory = {
  id?: number;
  menuId?: number;
  eatenAt?: string;
  rating?: number | null;
  date: string;
  menu: string;
  memo: string;
  image?: string;
  preference?: "like" | "dislike" | null;
  bookmarked?: boolean;
};

export type MeetingPurpose = {
  id: number;
  name: string;
};

export type PreferencePayload = {
  categoryPreferences: Array<{ categoryId: number; preferenceScore: number }>;
  tagPreferences: Array<{ tagId: number; preferenceScore: number }>;
  allergyIds: number[];
};

export type PreferenceScoreMap = Record<string, number>;

export type RecommendationRefreshValue = {
  recentDuplicateDays: number;
  includeNewMenu: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
};

export type RecommendationScoreBreakdown = {
  categoryScore?: number;
  tagScore?: number;
  menuPreferenceScore?: number;
  budgetScore?: number;
  newMenuScore?: number;
  historyPenalty?: number;
};

export const fallbackPickData: PickData = {
  categories: fallbackCategories,
  tags: fallbackTags,
  allergies: fallbackAllergies
};

// 백엔드 응답이 camelCase와 snake_case를 섞어 반환해도 화면 모델은 한 가지 형태로 맞춥니다.
export function normalizeLabel(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function readNumber(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  }
  return undefined;
}

export function readString(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function apiIdKeys(kind: keyof PickData) {
  if (kind === "categories") return ["categoryId", "category_id", "id"];
  if (kind === "tags") return ["tagId", "tag_id", "id"];
  return ["allergyId", "allergy_id", "id"];
}

export function mapPickItems(rows: unknown, fallbackItems: ApiPickItem[], kind: keyof PickData): ApiPickItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return fallbackItems;
  return rows.map((row, index) => {
    const label = readString(row, ["name", "label", "title"]) ?? fallbackItems[index]?.label ?? `항목 ${index + 1}`;
    const fallback = findFallbackPickItem(fallbackItems, kind, label);
    return {
      id: fallback?.id ?? `${kind}-${readNumber(row, apiIdKeys(kind)) ?? index}`,
      label,
      description: fallback?.description ?? "API에서 불러온 항목",
      image: fallback?.image ?? fallbackItems[index % fallbackItems.length]?.image ?? "",
      apiId: readNumber(row, apiIdKeys(kind))
    };
  });
}

function findFallbackPickItem(fallbackItems: ApiPickItem[], kind: keyof PickData, label: string) {
  const normalizedLabel = normalizeLabel(label);
  const directMatch = fallbackItems.find((item) => normalizeLabel(item.label) === normalizedLabel);
  if (directMatch) return directMatch;

  const aliasId = pickItemAliases[kind]?.[normalizedLabel];
  return aliasId ? fallbackItems.find((item) => item.id === aliasId) : undefined;
}

const pickItemAliases: Partial<Record<keyof PickData, Record<string, string>>> = {
  allergies: {
    쇠고기: "beef",
    소고기: "beef"
  }
};

export function mapMenus(rows: unknown): RemoteMenu[] {
  const items = Array.isArray(rows) ? rows : Array.isArray((rows as any)?.items) ? (rows as any).items : [];
  return items
    .map((row: any) => {
      const menuId = readNumber(row, ["menuId", "menu_id", "id"]) ?? 0;
      return {
        menuId,
        name: readString(row, ["name", "menuName", "menu_name"]) ?? "메뉴",
        categoryName: row?.menu_categories?.name ?? row?.category?.name,
        image: readString(row, ["imageUrl", "image_url", "image"]) ?? menuAsset(menuId)
      };
    })
    .filter((menu: RemoteMenu) => menu.menuId > 0);
}

export function mapMeetingPurposes(rows: unknown): MeetingPurpose[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row: any) => ({
      id: readNumber(row, ["meetingPurposeId", "meeting_purpose_id", "purpose_id", "id"]) ?? 0,
      name: readString(row, ["name", "title"]) ?? "식사"
    }))
    .filter((purpose) => purpose.id > 0);
}

export function mapUsers(payload: unknown): UserOption[] {
  const rows = Array.isArray((payload as any)?.items) ? (payload as any).items : Array.isArray(payload) ? payload : [];
  return rows
    .map((row: any) => ({
      userId: readNumber(row, ["userId", "user_id", "id"]) ?? 0,
      nickname: readString(row, ["nickname", "name", "email"]) ?? "사용자",
      email: readString(row, ["email"])
    }))
    .filter((user: UserOption) => user.userId > 0);
}

export function mapRecommendations(payload: unknown): DisplayRecommendation[] {
  const rows = Array.isArray((payload as any)?.results) ? (payload as any).results : [];
  return rows.map((row: any, index: number) => {
    const menuId = readNumber(row, ["menuId", "menu_id"]);
    return {
      rank: readNumber(row, ["rankNo", "rank_no", "rank"]) ?? index + 1,
      menuId,
      menu: readString(row, ["menuName", "menu_name", "name"]) ?? "추천 메뉴",
      score: Math.round((readNumber(row, ["totalScore", "total_score", "score"]) ?? 0) * 10) / 10,
      category: readString(row, ["category", "categoryName", "category_name"]) ?? "API",
      reason: readString(row, ["reason", "description"]) ?? "백엔드 추천 API가 반환한 결과입니다.",
      image: readString(row, ["imageUrl", "image_url", "image"]) ?? menuAsset(menuId),
      scores: mapRecommendationScores(row?.scores)
    };
  });
}

function mapRecommendationScores(scores: any): RecommendationScoreBreakdown | undefined {
  if (!scores || typeof scores !== "object") return undefined;

  return {
    categoryScore: readNumber(scores, ["categoryScore", "category_score"]),
    tagScore: readNumber(scores, ["tagScore", "tag_score"]),
    menuPreferenceScore: readNumber(scores, ["menuPreferenceScore", "menu_preference_score"]),
    budgetScore: readNumber(scores, ["budgetScore", "budget_score"]),
    newMenuScore: readNumber(scores, ["newMenuScore", "new_menu_score"]),
    historyPenalty: readNumber(scores, ["historyPenalty", "history_penalty"])
  };
}

// 완료된 모임은 목록 끝으로 보내서 진행 중인 모임을 먼저 보이게 합니다.
export function mapMeetings(payload: unknown): DisplayMeeting[] {
  const rows = Array.isArray((payload as any)?.items) ? (payload as any).items : Array.isArray(payload) ? payload : [];
  return rows
    .map((row: any, index: number): SortableDisplayMeeting => ({
      id: readNumber(row, ["meetingId", "meeting_id", "id"]) ?? index,
      title: readString(row, ["title", "name"]) ?? "모임",
      status: readString(row, ["status"]) ?? "참여자 입력 중",
      createdBy: readNumber(row, ["createdBy", "created_by"]),
      creatorNickname: readString(row, ["creatorNickname", "creator_nickname"]),
      meetingPurposeId: readNumber(row, ["meetingPurposeId", "meeting_purpose_id"]),
      meetingTime: readString(row, ["meetingTime", "meeting_time", "time"]),
      selectedMenuId: readNumber(row, ["selectedMenuId", "selected_menu_id"]) ?? null,
      rawTime: readString(row, ["meetingTime", "meeting_time", "time"]) ?? "",
      time: formatDateLabel(readString(row, ["meetingTime", "meeting_time", "time"]) ?? ""),
      place: readString(row, ["location", "place"]) ?? "장소 미정",
      members: Array.isArray(row?.participants)
        ? row.participants.map(mapParticipantMember)
        : Array.isArray(row?.members)
          ? row.members.map((member: any) =>
              typeof member === "string" ? { userId: null, name: member } : mapParticipantMember(member)
            )
          : [{ userId: null, name: "나" }]
    }))
    .sort((left: SortableDisplayMeeting, right: SortableDisplayMeeting) => {
      const doneDiff = Number(isDoneStatus(left.status)) - Number(isDoneStatus(right.status));
      if (doneDiff !== 0) return doneDiff;
      return new Date(left.rawTime).getTime() - new Date(right.rawTime).getTime();
    })
    .map(({ rawTime: _rawTime, ...meeting }: SortableDisplayMeeting) => meeting);
}

export function mapCreatedMeeting(row: any): DisplayMeeting {
  return {
    id: readNumber(row, ["meetingId", "meeting_id", "id"]),
    title: readString(row, ["title", "name"]) ?? "새 모임",
    status: readString(row, ["status"]) ?? "CREATED",
    createdBy: readNumber(row, ["createdBy", "created_by"]),
    creatorNickname: readString(row, ["creatorNickname", "creator_nickname"]),
    meetingPurposeId: readNumber(row, ["meetingPurposeId", "meeting_purpose_id"]),
    meetingTime: readString(row, ["meetingTime", "meeting_time"]),
    selectedMenuId: readNumber(row, ["selectedMenuId", "selected_menu_id"]) ?? null,
    time: formatDateLabel(readString(row, ["meetingTime", "meeting_time"]) ?? new Date().toISOString()),
    place: readString(row, ["location", "place"]) ?? "장소 미정",
    members: Array.isArray(row?.participants)
      ? row.participants.map(mapParticipantMember)
      : [{ userId: null, name: "나" }]
  };
}

function mapParticipantMember(participant: any): DisplayMember {
  return {
    userId: readNumber(participant, ["userId", "user_id"]) ?? null,
    name: readString(participant, ["displayName", "display_name", "name", "nickname"]) ?? "참여자"
  };
}

export function mapHistories(payload: unknown, menus: RemoteMenu[]): DisplayHistory[] {
  const rows = Array.isArray((payload as any)?.items) ? (payload as any).items : Array.isArray(payload) ? payload : [];
  const menuById = new Map(menus.map((menu) => [menu.menuId, menu]));
  return rows.map((row: any) => {
    const menuId = readNumber(row, ["menuId", "menu_id"]);
    const menu = typeof menuId === "number" ? menuById.get(menuId) : undefined;
    const rating = readNumber(row, ["rating"]);
    return {
      id: readNumber(row, ["historyId", "history_id", "id"]),
      menuId,
      eatenAt: readString(row, ["eatenAt", "eaten_at", "date"]),
      rating: typeof rating === "number" ? rating : null,
      date: formatShortDate(readString(row, ["eatenAt", "eaten_at", "date"]) ?? ""),
      menu: menu?.name ?? readString(row, ["menuName", "menu_name"]) ?? "식사 기록",
      memo: readString(row, ["memo"]) ?? `만족도 ${readNumber(row, ["rating"]) ?? "-"}`,
      image: menu?.image || menuAsset(menuId) || imageForMenu(menu?.name)
    };
  });
}

export function mapHistory(row: unknown, menus: RemoteMenu[]): DisplayHistory | null {
  return mapHistories([row], menus)[0] ?? null;
}

function imageForMenu(menuName?: string) {
  if (!menuName) return fallbackCategories[0].image;
  if (menuName.includes("파스타") || menuName.includes("올리오")) return fallbackCategories[2].image;
  if (menuName.includes("찌개") || menuName.includes("비빔")) return fallbackCategories[0].image;
  if (menuName.includes("돈") || menuName.includes("카츠")) return fallbackCategories[3].image;
  return fallbackCategories[0].image;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "시간 미정";
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "최근";
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date).replace(/\.$/, "");
}

function selectedApiIds(selected: string[], items: ApiPickItem[]) {
  const apiIdById = new Map(items.map((item) => [item.id, item.apiId]));
  return selected
    .map((id) => apiIdById.get(id))
    .filter((id): id is number => typeof id === "number");
}

export function selectedIdsFromPreferenceRows(rows: unknown, items: ApiPickItem[], keys: string[]) {
  if (!Array.isArray(rows)) return [];
  const apiIds = new Set(
    rows
      .map((row) => readNumber(row, keys))
      .filter((id): id is number => typeof id === "number")
  );
  return items.filter((item) => typeof item.apiId === "number" && apiIds.has(item.apiId)).map((item) => item.id);
}

export function selectedAllergyIdsFromPreferences(rows: unknown, items: ApiPickItem[]) {
  if (!Array.isArray(rows)) return [];
  const apiIds = new Set(
    rows
      .map((value) => (typeof value === "number" ? value : readNumber(value, ["allergyId", "allergy_id", "id"])))
      .filter((id): id is number => typeof id === "number")
  );
  return items.filter((item) => typeof item.apiId === "number" && apiIds.has(item.apiId)).map((item) => item.id);
}

export function scoreMapFromPreferenceRows(rows: unknown, items: ApiPickItem[], keys: string[]) {
  if (!Array.isArray(rows)) return {};
  const scoreByApiId = new Map<number, number>();
  for (const row of rows) {
    const apiId = readNumber(row, keys);
    const score = readNumber(row, ["preferenceScore", "preference_score"]);
    if (typeof apiId === "number" && typeof score === "number") {
      scoreByApiId.set(apiId, score);
    }
  }
  return items.reduce<PreferenceScoreMap>((acc, item) => {
    if (typeof item.apiId === "number" && scoreByApiId.has(item.apiId)) {
      acc[item.id] = scoreByApiId.get(item.apiId)!;
    }
    return acc;
  }, {});
}

export function buildPreferencePayload({
  selectedCategories,
  selectedTags,
  selectedAllergies,
  pickData,
  categoryScores,
  tagScores
}: {
  selectedCategories: string[];
  selectedTags: string[];
  selectedAllergies: string[];
  pickData: PickData;
  categoryScores: PreferenceScoreMap;
  tagScores: PreferenceScoreMap;
}): PreferencePayload {
  const categoryIdByApiId = new Map(pickData.categories.map((item) => [item.apiId, item.id]));
  const tagIdByApiId = new Map(pickData.tags.map((item) => [item.apiId, item.id]));

  return {
    categoryPreferences: selectedApiIds(selectedCategories, pickData.categories).map((categoryId) => ({
      categoryId,
      preferenceScore: categoryScores[categoryIdByApiId.get(categoryId) ?? ""] ?? 5
    })),
    tagPreferences: selectedApiIds(selectedTags, pickData.tags).map((tagId) => ({
      tagId,
      preferenceScore: tagScores[tagIdByApiId.get(tagId) ?? ""] ?? 5
    })),
    allergyIds: selectedApiIds(selectedAllergies, pickData.allergies)
  };
}

function isDoneStatus(status: string) {
  return status === "DECIDED" || status === "CLOSED" || status.includes("확정");
}
