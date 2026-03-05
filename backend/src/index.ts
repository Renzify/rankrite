import express from "express";
import path from "path";
import cors from "cors";

import { ENV } from "./lib/env.ts";

const app = express();
const { PORT, CLIENT_URL, NODE_ENV } = ENV;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running in port:", PORT);
});
