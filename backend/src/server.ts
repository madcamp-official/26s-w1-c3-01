import { app } from "./app.js";
import { env } from "./config/env.js";
import { authService } from "./modules/auth/auth.service.js";

const GUEST_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

app.listen(env.port, () => {
  console.log(`MUK PICK backend listening on port ${env.port}`);
});

setInterval(() => {
  void authService.cleanupExpiredGuests().catch((error) => {
    console.error("Expired guest cleanup failed", error);
  });
}, GUEST_CLEANUP_INTERVAL_MS).unref();
