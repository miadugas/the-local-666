import express from "express";
import { env } from "./env.js";

const app = express();

app.get("/", (_req, res) => {
  res.json({ name: "grave-goods backend", phase: 1 });
});

app.listen(env.port, () => {
  console.log(`[backend] listening on http://localhost:${env.port}`);
});
