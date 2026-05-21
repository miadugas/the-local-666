import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.get("/", (_req, res) => {
  res.json({ name: "grave-goods backend", phase: 1 });
});

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
