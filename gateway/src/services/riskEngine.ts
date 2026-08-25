export interface RiskSignal {
  name: string;
  score: number;
  detected: boolean;
}

export interface RiskResult {
  score: number;
  level: "NORMAL" | "SUSPICIOUS" | "HIGH" | "CRITICAL";
  action: "ALLOW" | "MONITOR" | "THROTTLE" | "BLOCK";
  signals: RiskSignal[];
}

export function calculateRisk(signals: RiskSignal[]): RiskResult {
  const score = Math.min(
    100,
    signals.reduce((total, signal) => {
      return total + (signal.detected ? signal.score : 0);
    }, 0)
  );

  let level: RiskResult["level"];
  let action: RiskResult["action"];

  if (score <= 30) {
    level = "NORMAL";
    action = "ALLOW";
  } else if (score <= 60) {
    level = "SUSPICIOUS";
    action = "MONITOR";
  } else if (score <= 80) {
    level = "HIGH";
    action = "THROTTLE";
  } else {
    level = "CRITICAL";
    action = "BLOCK";
  }

  return {
    score,
    level,
    action,
    signals,
  };
}