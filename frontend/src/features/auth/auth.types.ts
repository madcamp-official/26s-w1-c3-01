export type SignupRequest = {
  email: string;
  password: string;
  nickname?: string;
  userType?: string;
};

export type SignupResponse = {
  user: unknown;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type ResendSignupEmailResponse = {
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: unknown;
};

export type GuestSignupResponse = {
  guest: true;
  nickname: string;
  user: unknown;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type RefreshResponse = LoginResponse;

export type NicknameAvailabilityResponse = {
  nickname: string;
  available: boolean;
};
