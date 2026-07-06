import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { preferenceService } from "./preference.service.js";

// 현재 로그인한 사용자의 선호도 전체를 조회한다.
export const getMyPreferences: RequestHandler = async (req, res, next) => {
  try {
    const data = await preferenceService.getMyPreferences(req.auth!.profile.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// 현재 로그인한 사용자의 선호도 전체를 저장한다.
// 기존 선호도 데이터를 삭제하고 요청 body 기준으로 다시 저장한다.
export const replaceMyPreferences: RequestHandler = async (req, res, next) => {
  try {
    const data = await preferenceService.replaceMyPreferences(
      req.auth!.profile.userId,
      req.body
    );

    sendSuccess(res, data, 200, "선호도가 저장되었습니다.");
  } catch (error) {
    next(error);
  }
};