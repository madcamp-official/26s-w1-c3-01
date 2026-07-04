import type { User } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        accessToken: string;
        user: User;
        profile?: {
          userId: number;
          email: string;
          nickname: string;
          userType: string | null;
        };
      };
    }
  }
}

export {};
