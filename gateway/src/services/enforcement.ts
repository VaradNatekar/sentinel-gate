import type { Response } from "express";

export function enforceRisk(
  risk: {
    score: number;
    level: string;
    action: "ALLOW" | "MONITOR" | "THROTTLE" | "BLOCK";
  },
  res: Response
): boolean {
  if (risk.action === "BLOCK") {
    res.status(403).json({
      error: "Request blocked by Sentinel Gate",
      riskScore: risk.score,
      riskLevel: risk.level,
      action: risk.action,
    });

    return false;
  }

  if (risk.action === "THROTTLE") {
    res.status(429).json({
      error: "Request throttled by Sentinel Gate",
      riskScore: risk.score,
      riskLevel: risk.level,
      action: risk.action,
    });

    return false;
  }

  return true;
}