import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12)
};
