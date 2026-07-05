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

export type GuestSignupRequest = {
  displayName?: string;
};

export type AuthUserResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: unknown;
};
