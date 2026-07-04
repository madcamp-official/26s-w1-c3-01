import type { User } from "@supabase/supabase-js";

export type AuthProfile = {
  userId: number;
  authUserId: string;
  email: string;
  nickname: string;
  userType: string | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        // 프론트에서 보낸 Supabase access token
        accessToken: string;

        // Supabase Auth의 사용자 객체
        user: User;

        // public.users 테이블에 저장된 앱 사용자 프로필
        profile: AuthProfile;
      };
    }
  }
}

export {};