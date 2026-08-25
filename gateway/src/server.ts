import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import { recordRequest } from "./services/requestCounter.js";
import { detectBurst } from "./services/burstDetector.js";
import { calculateRisk } from "./services/riskEngine.js";
import { detectIPRotation } from "./services/ipRotationDetector.js";
import { detectTokenReuse } from "./services/tokenReuseDetector.js";
import { enforceRisk } from "./services/enforcement.js";
const app = express();
const PORT = 3000;
const DEMO_API_URL = "http://localhost:4000";

app.use(express.json());
app.use(requestLogger);
app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const requestCount = recordRequest(ip);
  const clientKey =
  req.headers.authorization ||
  `${req.headers["user-agent"] || "unknown"}:${req.originalUrl}`;

const ipRotation = detectIPRotation(clientKey, ip);
const token = req.headers.authorization;

const tokenReuse = detectTokenReuse(
  token?.toString(),
  ip
);

  const burst = detectBurst(requestCount);

  const risk = calculateRisk([
  {
    name: "burst",
    score: burst.score,
    detected: burst.detected,
  },
  {
    name: "ipRotation",
    score: ipRotation.score,
    detected: ipRotation.detected,
  },
  {
    name: "tokenReuse",
    score: tokenReuse.score,
    detected: tokenReuse.detected,
  },
]);

console.log({
  client: ip,
  requestsLastMinute: requestCount,
  burstDetected: burst.detected,
  ipRotationDetected: ipRotation.detected,
  tokenReuseDetected: tokenReuse.detected,
  riskScore: risk.score,
  riskLevel: risk.level,
  action: risk.action,
  signals: risk.signals,
});

const allowed = enforceRisk(risk, res);

if (!allowed) {
  return;
}

next();
});
// Health check
app.get("/health", (_req, res) => {
  res.json({
    service: "sentinel-gate",
    status: "ok",
  });
});

// Proxy request to Demo API
app.get("/api/results", async (_req, res) => {
  try {
    const response = await fetch(
      `${DEMO_API_URL}/api/results`
    );

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Gateway error:", error);

    res.status(502).json({
      error: "Demo API unavailable",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Sentinel Gate running on http://localhost:${PORT}`
  );
});