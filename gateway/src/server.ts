import express from "express";
import cors from "cors";

import { requestLogger } from "./middleware/requestLogger.js";
import { recordRequest } from "./services/requestCounter.js";
import { detectBurst } from "./services/burstDetector.js";
import { calculateRisk, type RiskResult } from "./services/riskEngine.js";
import { detectIPRotation } from "./services/ipRotationDetector.js";
import { detectTokenReuse } from "./services/tokenReuseDetector.js";
import { enforceRisk } from "./services/enforcement.js";
import redisClient, { connectRedis } from "./services/redisClient.js";
import { buildAttackDNA } from "./services/attackDna.js";
import {
  createDecisionTransition,
  type DecisionTimelineEntry,
} from "./services/decisionTimeline.js";
import { detectBusinessFlowRisk } from "./services/businessFlowRisk.js";
import {
  simulateCounterfactual,
  type CounterfactualScenario,
} from "./services/counterfactualDefense.js";

const app = express();

const PORT = 3000;
const DEMO_API_URL = "http://localhost:4000";

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Forwarded-For",
      "User-Agent",
    ],
  })
);

app.use(express.json());
app.use(requestLogger);

// ----------------------------------------------------
// Security Audit Log & Telemetry
// ----------------------------------------------------

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  hasToken: boolean;
  requestCount: number;
  risk: RiskResult;
  attackDNA: ReturnType<typeof buildAttackDNA>;
  decisionTimeline: DecisionTimelineEntry[];
  businessFlow: ReturnType<typeof detectBusinessFlowRisk>;
  status: number;
  durationMs?: number;
}

const MAX_EVENT_HISTORY = 200;

const securityEvents: SecurityAuditEntry[] = [];

// Track the previous security state for each client.
const previousDecisions = new Map<
  string,
  {
    risk: number;
    level: RiskResult["level"];
    action: RiskResult["action"];
  }
>();

// Aggregated telemetry counters
const telemetry = {
  startTime: new Date().toISOString(),
  totalRequests: 0,
  allowedRequests: 0,
  monitoredRequests: 0,
  throttledRequests: 0,
  blockedRequests: 0,

  signalsTriggered: {
    burst: 0,
    ipRotation: 0,
    tokenReuse: 0,
  },

  riskDistribution: {
    NORMAL: 0,
    SUSPICIOUS: 0,
    HIGH: 0,
    CRITICAL: 0,
  },
};

// ----------------------------------------------------
// Sentinel Gate Management & Dashboard APIs
// ----------------------------------------------------

// Health check
app.get("/health", (_req, res) => {
  res.json({
    service: "sentinel-gate",
    status: "ok",
    uptime: process.uptime(),
    redis: redisClient.isOpen ? "connected" : "disconnected",
  });
});

// Detailed health check including Demo API connectivity
app.get("/api/sentinel/health", async (_req, res) => {
  let demoApiStatus = "offline";

  try {
    const demoRes = await fetch(`${DEMO_API_URL}/api/results`, {
      signal: AbortSignal.timeout(1500),
    });

    if (demoRes.ok) {
      demoApiStatus = "online";
    }
  } catch {
    demoApiStatus = "offline";
  }

  res.json({
    gateway: "online",
    redis: redisClient.isOpen ? "online" : "offline",
    demoApi: demoApiStatus,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Live Telemetry
// ----------------------------------------------------

app.get("/api/sentinel/telemetry", async (_req, res) => {
  let activeRedisKeysCount = 0;
  let trackedIps: string[] = [];

  try {
    if (redisClient.isOpen) {
      const keys = await redisClient.keys("*");

      activeRedisKeysCount = keys.length;

      trackedIps = keys
        .filter((key) => key.startsWith("requests:"))
        .map((key) => key.replace("requests:", ""));
    }
  } catch (error) {
    console.error("Error inspecting Redis keys:", error);
  }

  const recent10 = securityEvents.slice(-10);

  const avgRisk =
    recent10.length > 0
      ? Math.round(
          recent10.reduce(
            (acc, current) => acc + current.risk.score,
            0
          ) / recent10.length
        )
      : 0;

  const peakRisk =
    securityEvents.length > 0
      ? Math.max(
          ...securityEvents.map((event) => event.risk.score)
        )
      : 0;

  res.json({
    ...telemetry,
    activeRedisKeys: activeRedisKeysCount,
    trackedIps,
    recentAvgRisk: avgRisk,
    peakRisk,
    eventCount: securityEvents.length,
  });
});

// ----------------------------------------------------
// Security Events
// ----------------------------------------------------

app.get("/api/sentinel/events", (req, res) => {
  const limit = Math.min(
    100,
    parseInt((req.query.limit as string) || "50", 10)
  );

  const filterLevel = req.query.level as string | undefined;

  let filtered = [...securityEvents].reverse();

  if (filterLevel && filterLevel !== "ALL") {
    filtered = filtered.filter(
      (event) => event.risk.level === filterLevel
    );
  }

  res.json({
    total: securityEvents.length,
    events: filtered.slice(0, limit),
  });
});
// ----------------------------------------------------
// Counterfactual Defense Lab
// ----------------------------------------------------

app.post("/api/sentinel/counterfactual", (req, res) => {
  try {
    const {
      eventId,
      scenario,
    }: {
      eventId?: string;
      scenario?: CounterfactualScenario;
    } = req.body ?? {};

    if (!eventId) {
      return res.status(400).json({
        error: "eventId is required",
      });
    }

    if (!scenario || !scenario.name || !scenario.description) {
      return res.status(400).json({
        error:
          "scenario with name and description is required",
      });
    }

    const event = securityEvents.find(
      (item) => item.id === eventId
    );

    if (!event) {
      return res.status(404).json({
        error: "Security event not found",
      });
    }

    const result = simulateCounterfactual(
      event.risk,
      scenario
    );

    res.json({
      eventId: event.id,
      attackDNA: event.attackDNA,
      businessFlow: event.businessFlow,
      result,
    });
  } catch (error) {
    console.error(
      "Counterfactual simulation error:",
      error
    );

    res.status(500).json({
      error: "Counterfactual simulation failed",
    });
  }
});
// ----------------------------------------------------
// Reset System State
// ----------------------------------------------------

app.post("/api/sentinel/reset", async (_req, res) => {
  try {
    if (redisClient.isOpen) {
      const keys = await redisClient.keys("*");

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    securityEvents.length = 0;
    previousDecisions.clear();

    telemetry.totalRequests = 0;
    telemetry.allowedRequests = 0;
    telemetry.monitoredRequests = 0;
    telemetry.throttledRequests = 0;
    telemetry.blockedRequests = 0;

    telemetry.signalsTriggered.burst = 0;
    telemetry.signalsTriggered.ipRotation = 0;
    telemetry.signalsTriggered.tokenReuse = 0;

    telemetry.riskDistribution.NORMAL = 0;
    telemetry.riskDistribution.SUSPICIOUS = 0;
    telemetry.riskDistribution.HIGH = 0;
    telemetry.riskDistribution.CRITICAL = 0;

    console.log("Sentinel Gate state reset successfully");

    res.json({
      success: true,
      message:
        "Sentinel Gate telemetry and Redis threat cache reset",
    });
  } catch (error) {
    console.error(
      "Failed to reset Sentinel Gate:",
      error
    );

    res.status(500).json({
      error: "Failed to reset threat cache",
    });
  }
});

// ----------------------------------------------------
// Security Threat Detection & Mitigation Middleware
// ----------------------------------------------------

app.use(async (req, res, next) => {
  // Bypass internal Sentinel APIs from security blocking
  if (
    req.path.startsWith("/api/sentinel") ||
    req.path === "/health"
  ) {
    return next();
  }

  const startTime = Date.now();
  const eventId = Math.random()
    .toString(36)
    .substring(2, 9);

  try {
    // ------------------------------------------------
    // Client information
    // ------------------------------------------------

    const ip =
      req.headers["x-forwarded-for"]
        ?.toString()
        .split(",")[0]
        ?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const userAgent =
      req.headers["user-agent"] || "unknown";

    const rawToken = req.headers.authorization;
    const token = rawToken?.toString();
    const hasToken = Boolean(token);

    // ------------------------------------------------
    // Existing detection pipeline
    // ------------------------------------------------

    const requestCount = await recordRequest(ip);

    const clientKey =
      token || `${userAgent}:${req.originalUrl}`;

    const ipRotation = await detectIPRotation(
      clientKey,
      ip
    );

    const tokenReuse = await detectTokenReuse(
      token,
      ip
    );

    const burst = detectBurst(requestCount);

    // ------------------------------------------------
    // Business-flow context
    // ------------------------------------------------

    const businessFlow =
      detectBusinessFlowRisk(req.path);

    // ------------------------------------------------
    // Risk calculation
    // ------------------------------------------------

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
      {
        name: "businessFlow",
        score: businessFlow.score,
        detected: businessFlow.score > 0,
      },
    ]);

    // ------------------------------------------------
    // Attack DNA
    // ------------------------------------------------

    const attackDNA = buildAttackDNA(
      risk,
      [
        burst.reason ?? "",
        ipRotation.reason ?? "",
        tokenReuse.reason ?? "",
        businessFlow.reason,
      ].filter(Boolean)
    );

    // ------------------------------------------------
    // Decision Timeline
    // ------------------------------------------------

    const previousDecision =
      previousDecisions.get(clientKey);

    const signalThatTriggered =
      risk.signals.find(
        (signal) => signal.detected
      )?.name;

    const timelineEntry =
      createDecisionTransition(
        previousDecision?.risk ?? 0,
        previousDecision?.level ?? "NORMAL",
        previousDecision?.action ?? "ALLOW",
        risk,
        signalThatTriggered,
        attackDNA.reason
      );

    previousDecisions.set(clientKey, {
      risk: risk.score,
      level: risk.level,
      action: risk.action,
    });

    const decisionTimeline = timelineEntry
      ? [timelineEntry]
      : [];

    // ------------------------------------------------
    // Telemetry
    // ------------------------------------------------

    telemetry.totalRequests++;
    telemetry.riskDistribution[risk.level]++;

    if (burst.detected) {
      telemetry.signalsTriggered.burst++;
    }

    if (ipRotation.detected) {
      telemetry.signalsTriggered.ipRotation++;
    }

    if (tokenReuse.detected) {
      telemetry.signalsTriggered.tokenReuse++;
    }

    switch (risk.action) {
      case "ALLOW":
        telemetry.allowedRequests++;
        break;

      case "MONITOR":
        telemetry.monitoredRequests++;
        break;

      case "THROTTLE":
        telemetry.throttledRequests++;
        break;

      case "BLOCK":
        telemetry.blockedRequests++;
        break;
    }

    // ------------------------------------------------
    // Security Audit Entry
    // ------------------------------------------------

    const auditEntry: SecurityAuditEntry = {
      id: eventId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      ip,
      userAgent,
      hasToken,
      requestCount,
      risk,
      attackDNA,
      decisionTimeline,
      businessFlow,
      status: 200,
      durationMs: 0,
    };

    // ------------------------------------------------
    // Enforcement
    // ------------------------------------------------

    const allowed = enforceRisk(risk, res);

    if (!allowed) {
      auditEntry.status =
        risk.action === "BLOCK"
          ? 403
          : 429;

      auditEntry.durationMs =
        Date.now() - startTime;

      securityEvents.push(auditEntry);

      if (
        securityEvents.length >
        MAX_EVENT_HISTORY
      ) {
        securityEvents.shift();
      }

      return;
    }

    // ------------------------------------------------
    // Capture response status
    // ------------------------------------------------

    res.on("finish", () => {
      auditEntry.status = res.statusCode;
      auditEntry.durationMs =
        Date.now() - startTime;

      securityEvents.push(auditEntry);

      if (
        securityEvents.length >
        MAX_EVENT_HISTORY
      ) {
        securityEvents.shift();
      }
    });

    next();
  } catch (error) {
    console.error(
      "Gateway middleware error:",
      error
    );

    res.status(500).json({
      error: "Internal gateway error",
    });
  }
});

// ----------------------------------------------------
// Generic Dynamic Proxy to Demo API
// ----------------------------------------------------

app.all(/^\/api\/.*/, async (req, res) => {
  const targetUrl =
    `${DEMO_API_URL}${req.originalUrl}`;

  console.log(
    `Proxying ${req.method} request to: ${targetUrl}`
  );

  try {
    const headers: Record<string, string> = {};

    for (const [key, value] of Object.entries(
      req.headers
    )) {
      if (
        value &&
        typeof value === "string" &&
        key.toLowerCase() !== "host"
      ) {
        headers[key] = value;
      }
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      req.body
    ) {
      fetchOptions.body =
        JSON.stringify(req.body);

      headers["content-type"] =
        "application/json";
    }

    const response = await fetch(
      targetUrl,
      fetchOptions
    );

    const data = await response
      .json()
      .catch(() => ({}));

    res.setHeader(
      "X-Sentinel-Protected",
      "true"
    );

    res.status(response.status).json(data);
  } catch (error) {
    console.error(
      "Gateway proxy error:",
      error
    );

    res.status(502).json({
      error:
        "Demo API backend service unavailable",
      targetUrl,
    });
  }
});

// ----------------------------------------------------
// Server Initialization
// ----------------------------------------------------

async function startServer() {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(
        `Sentinel Gate running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start Sentinel Gate:",
      error
    );

    process.exit(1);
  }
}

startServer();