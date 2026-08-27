export interface RiskSignal {
  name: "burst" | "ipRotation" | "tokenReuse" | string;
  score: number;
  detected: boolean;
}

export type RiskLevel = "NORMAL" | "SUSPICIOUS" | "HIGH" | "CRITICAL";
export type EnforcementAction = "ALLOW" | "MONITOR" | "THROTTLE" | "BLOCK";

export interface RiskResult {
  score: number;
  level: RiskLevel;
  action: EnforcementAction;
  signals: RiskSignal[];
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  hasToken: boolean;
  token?: string;
  requestCount: number;
  risk: RiskResult;
  status: number;
  durationMs?: number;
}

export interface SentinelTelemetry {
  startTime: string;
  totalRequests: number;
  allowedRequests: number;
  monitoredRequests: number;
  throttledRequests: number;
  blockedRequests: number;
  signalsTriggered: {
    burst: number;
    ipRotation: number;
    tokenReuse: number;
  };
  riskDistribution: {
    NORMAL: number;
    SUSPICIOUS: number;
    HIGH: number;
    CRITICAL: number;
  };
  activeRedisKeys: number;
  trackedIps: string[];
  recentAvgRisk: number;
  peakRisk: number;
  eventCount: number;
}

export interface SystemHealth {
  gateway: "online" | "offline";
  redis: "online" | "offline";
  demoApi: "online" | "offline";
  timestamp: string;
}

export interface SimulationResult {
  request: number;
  ip: string;
  token?: string;
  status: number;
  durationMs: number;
  data: any;
  riskScore?: number;
  riskLevel?: string;
  action?: string;
}
