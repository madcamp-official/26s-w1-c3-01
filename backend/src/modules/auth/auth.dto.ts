export type SignupRequest = {
  email: string;
  password: string;
  nickname: string;
  userType?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthProfileResponse = {
  userId: number;
  authUserId: string;
  email: string;
  nickname: string;
  userType: string | null;
};

export type AuthSessionResponse = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};

export type SignupResponse = {
  user: AuthProfileResponse | null;
  session: AuthSessionResponse;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: AuthProfileResponse;
};