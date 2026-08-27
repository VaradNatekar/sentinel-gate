import type { RiskResult } from "./riskEngine.js";

export interface DecisionTimelineEntry {
  timestamp: string;
  previousRisk: number;
  newRisk: number;
  previousLevel: RiskResult["level"];
  newLevel: RiskResult["level"];
  previousAction: RiskResult["action"];
  newAction: RiskResult["action"];
  signal?: string;
  reason: string;
}

export function createDecisionTransition(
  previousRisk: number,
  previousLevel: RiskResult["level"],
  previousAction: RiskResult["action"],
  currentRisk: RiskResult,
  signal?: string,
  reason = "Security decision changed."
): DecisionTimelineEntry | null {
  const levelChanged = previousLevel !== currentRisk.level;
  const actionChanged = previousAction !== currentRisk.action;

  // Only record meaningful security-state transitions.
  if (!levelChanged && !actionChanged) {
    return null;
  }

  const entry: DecisionTimelineEntry = {
    timestamp: new Date().toISOString(),
    previousRisk,
    newRisk: currentRisk.score,
    previousLevel,
    newLevel: currentRisk.level,
    previousAction,
    newAction: currentRisk.action,
    reason,
  };

  if (signal !== undefined) {
    entry.signal = signal;
  }

  return entry;
}