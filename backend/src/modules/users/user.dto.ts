export type UpdateUserRequest = {
  nickname?: string;
  userType?: "PERSONAL" | "GROUP_HOST";
};

export type UserProfileResponse = {
  userId: number;
  authUserId: string;
  email: string;
  nickname: string;
  userType: string | null;
};