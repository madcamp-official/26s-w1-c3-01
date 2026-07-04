import { comparePassword, hashPassword } from "../../common/utils/password.js";
import { signAccessToken } from "../../common/utils/jwt.js";
import { authRepository } from "./auth.repository.js";
import type { LoginRequest, SignupRequest } from "./auth.dto.js";

export const authService = {
  async signup(input: SignupRequest) {
    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({ ...input, passwordHash });
    const accessToken = signAccessToken({ userId: Number(user.userId), email: user.email });
    return { user, accessToken };
  },

  async login(input: LoginRequest) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user?.passwordHash) throw Object.assign(new Error("이메일 또는 비밀번호가 올바르지 않습니다."), { status: 401, code: "UNAUTHORIZED" });
    const matched = await comparePassword(input.password, user.passwordHash);
    if (!matched) throw Object.assign(new Error("이메일 또는 비밀번호가 올바르지 않습니다."), { status: 401, code: "UNAUTHORIZED" });
    const accessToken = signAccessToken({ userId: Number(user.userId), email: user.email });
    return { accessToken, user };
  }
};
