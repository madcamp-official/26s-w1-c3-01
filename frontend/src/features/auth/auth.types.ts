export type SignupRequest = {
  email: string;
  password: string;
  nickname: string;
  userType?: string;
};

export type SignupResponse = {
  user: unknown;
  session: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  };
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: unknown;
};
