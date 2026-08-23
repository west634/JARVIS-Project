import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { config } from "./config.js";
import { chatRouter } from "./routes/chat.js";
import { speechRouter } from "./routes/speech.js";
import { metaRouter } from "./routes/meta.js";
import { actionsRouter } from "./routes/actions.js";
import { startClapDetector, openOnDoubleClap } from "./clap/detector.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", chatRouter);
app.use("/api", speechRouter);
app.use("/api", metaRouter);
app.use("/api", actionsRouter);

// Serve the built client in production, if present.
const clientDist = path.resolve(__dirname, "../../client/dist");
const servingClient = fs.existsSync(clientDist);
if (servingClient) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", err instanceof Error ? err.message : err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(config.port, () => {
  console.log(`SENTINEL backend listening on http://localhost:${config.port}`);
});

if (config.clapToOpenEnabled) {
  // In dev, the client runs separately on Vite's port; in production this
  // server serves it directly. Override with CLAP_OPEN_URL if neither guess fits.
  const openUrl = config.clapOpenUrl || (servingClient ? `http://localhost:${config.port}` : "http://localhost:5173");
  startClapDetector({
    onDoubleClap: () => {
      console.log(`Clap-to-open: double clap detected, opening ${openUrl}`);
      void openOnDoubleClap(openUrl);
    },
    onUnavailable: (reason) => console.warn(`Clap-to-open disabled: ${reason}`),
  });
  console.log(`Clap-to-open armed — double-clap to open ${openUrl}`);
}
