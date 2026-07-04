export type SignupRequest = {
  email: string;
  password: string;
  nickname: string;
  userType?: string;
};

export type SignupResponse = {
  user: unknown;
  accessToken?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: unknown;
};
