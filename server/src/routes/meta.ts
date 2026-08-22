import { Router } from "express";
import { ASSISTANT_NAME } from "../assistant/persona.js";

export const metaRouter = Router();

metaRouter.get("/config", (_req, res) => {
  // Only ever return non-secret, display-oriented configuration here.
  res.json({ assistantName: ASSISTANT_NAME });
});

metaRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
