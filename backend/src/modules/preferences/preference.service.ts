import { preferenceRepository } from "./preference.repository.js";
import type { ReplacePreferenceRequest } from "./preference.dto.js";

export const preferenceService = {
  // 내 선호도 전체 조회
  getMyPreferences(userId: number) {
    return preferenceRepository.findByUserId(userId);
  },

  // 내 선호도 전체 저장
  // 현재 정책은 기존 데이터를 모두 지우고 새 데이터로 교체하는 방식이다.
  replaceMyPreferences(userId: number, input: ReplacePreferenceRequest) {
    return preferenceRepository.replaceByUserId(userId, input);
  }
};