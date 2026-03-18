import express from "express";
import { createServer } from "http";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

import templateRoutes from "./routes/templateRoute.ts";
import eventRoutes from "./routes/eventRoute.ts";
import authRoutes from "./routes/authRoute.ts";
import activityLogRoutes from "./routes/activityLogRoute.ts";
import { protectRoute } from "./middlewares/authMiddleware.ts";
import { initSocketServer } from "./realtime/socketServer.ts";

import { ENV } from "./lib/env.ts";

const app = express();
const { PORT, CLIENT_URL, NODE_ENV } = ENV;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", protectRoute, templateRoutes);
app.use("/api", protectRoute, eventRoutes);
app.use("/api", protectRoute, activityLogRoutes);

if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log("Server is running in port:", PORT);
});
