type MeetingRecommendationBase = {
  meeting: any;
  participantUserIds: number[];
  menus: any[];
  menuTags: any[];
  menuAllergies: any[];
  purposeSuitability: any[];
  categoryPreferences: any[];
  tagPreferences: any[];
  menuPreferences: any[];
  userAllergies: any[];
};

export function rankMeetingMenus(base: MeetingRecommendationBase, input: any = {}) {
  const limit = Number(input.limit ?? 3);
  const participantCount = Math.max(1, base.participantUserIds.length);
  const allergyIds = new Set(base.userAllergies.map((row) => Number(row.allergy_id)));
  const purposeId = Number(base.meeting.meeting_purpose_id);

  return base.menus
    .flatMap((menu) => {
      const menuId = Number(menu.menu_id);
      const suitability = base.purposeSuitability.find(
        (row) => Number(row.menu_id) === menuId && Number(row.meeting_purpose_id) === purposeId
      );
      const hasSuitabilityData = Boolean(suitability);
      const suitabilityScore = hasSuitabilityData ? Number(suitability.suitability_score) : 1.5;
      if (suitabilityScore <= 0) return [];

      const menuAllergyIds = base.menuAllergies
        .filter((row) => Number(row.menu_id) === menuId)
        .map((row) => Number(row.allergy_id));
      if (menuAllergyIds.some((allergyId) => allergyIds.has(allergyId))) {
        return [];
      }

      const tagIds = base.menuTags.filter((row) => Number(row.menu_id) === menuId).map((row) => Number(row.tag_id));
      const categoryScore = average(
        base.categoryPreferences
          .filter((row) => Number(row.category_id) === Number(menu.category_id))
          .map((row) => Number(row.preference_score)),
        participantCount
      );
      const menuScore = average(
        base.menuPreferences.filter((row) => Number(row.menu_id) === menuId).map((row) => Number(row.preference_score)),
        participantCount
      );
      const tagScore = average(
        base.tagPreferences.filter((row) => tagIds.includes(Number(row.tag_id))).map((row) => Number(row.preference_score)),
        participantCount
      );
      const totalScore = Math.max(0, Math.min(100, Number((45 + suitabilityScore * 7 + categoryScore * 5 + tagScore * 3 + menuScore * 6).toFixed(2))));
      const categoryName = menu.menu_categories?.name ?? "메뉴";

      return [{
        rankNo: 0,
        menuId,
        menuName: menu.name,
        totalScore,
        categoryName,
        reason: hasSuitabilityData
          ? `${base.participantUserIds.length}명 선호 평균, ${base.meeting.meeting_purpose_id}번 목적 적합도 ${suitabilityScore}, ${categoryName} 카테고리 점수를 반영했습니다.`
          : `${base.participantUserIds.length}명 선호 평균과 ${categoryName} 카테고리 점수를 반영했습니다. 목적 적합도 데이터가 없어 기본 후보로 계산했습니다.`
      }];
    })
    .sort((left, right) => right.totalScore - left.totalScore || left.menuName.localeCompare(right.menuName, "ko"))
    .slice(0, limit)
    .map((item, index) => ({ ...item, rankNo: index + 1 }));
}

function average(values: number[], divisor: number) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / divisor;
}
