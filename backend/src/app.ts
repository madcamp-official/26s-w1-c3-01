import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import { sendSuccess } from "./common/utils/apiResponse.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  sendSuccess(res, { status: "ok" });
});

app.use("/api/v1", apiRouter);
app.use(errorMiddleware);
