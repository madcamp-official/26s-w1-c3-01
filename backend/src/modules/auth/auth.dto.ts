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
