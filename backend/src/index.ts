import express from "express";
import path from "path";
import cors from "cors";

import { ENV } from "./lib/env.ts";
import { templateRouter } from "./routes/template.route.ts";
import { eventRouter } from "./routes/event.route.ts";

const app = express();
const { PORT, CLIENT_URL, NODE_ENV } = ENV;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/templates", templateRouter);
app.use("/api/events", eventRouter);

if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running in port:", PORT);
});
