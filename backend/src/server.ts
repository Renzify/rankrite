import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

import templateRoutes from "./routes/templateRoute.ts";
import eventRoutes from "./routes/eventRoute.ts";
import authRoutes from "./routes/authRoute.ts";
import { protectRoute } from "./middlewares/authMiddleware.ts";

import { ENV } from "./lib/env.ts";

const app = express();
const { PORT, CLIENT_URL, NODE_ENV } = ENV;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", protectRoute, templateRoutes);
app.use("/api", protectRoute, eventRoutes);

if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running in port:", PORT);
});
