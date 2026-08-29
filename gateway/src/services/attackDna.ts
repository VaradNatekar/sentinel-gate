import type { RiskResult, RiskSignal } from "./riskEngine.js";

export type AttackType =
  | "NORMAL_TRAFFIC"
  | "SENSITIVE_BUSINESS_FLOW"
  | "BURST_ABUSE"
  | "IP_ROTATION_ABUSE"
  | "TOKEN_REUSE_ABUSE"
  | "PAYLOAD_INJECTION"
  | "OBFUSCATED_PAYLOAD"
  | "MULTI_SIGNAL_API_ABUSE"
  | "COORDINATED_API_ABUSE";

export interface AttackDNA {
  attackType: AttackType;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  signals: RiskSignal[];
  evidence: string[];
  reason: string;
}

export function buildAttackDNA(
  risk: RiskResult,
  evidence: string[] = []
): AttackDNA {
  const detectedSignals = risk.signals.filter(
    (signal) => signal.detected
  );

  // ------------------------------------------------
  // No signals detected
  // ------------------------------------------------

  if (detectedSignals.length === 0) {
    return {
      attackType: "NORMAL_TRAFFIC",
      confidence: "LOW",
      signals: risk.signals,
      evidence: [],
      reason: "No abuse signals were detected.",
    };
  }

  // ------------------------------------------------
  // Identify specific security signals
  // ------------------------------------------------

  const burstDetected = detectedSignals.some(
    (signal) => signal.name === "burst"
  );

  const ipRotationDetected = detectedSignals.some(
    (signal) => signal.name === "ipRotation"
  );

  const tokenReuseDetected = detectedSignals.some(
    (signal) => signal.name === "tokenReuse"
  );

  const businessFlowDetected = detectedSignals.some(
    (signal) => signal.name === "businessFlow"
  );

  const payloadThreatDetected = detectedSignals.some(
    (signal) => signal.name === "payloadThreat"
  );

  const entropyDetected = detectedSignals.some(
    (signal) => signal.name === "entropy"
  );

  const abuseSignalCount =
    Number(burstDetected) +
    Number(ipRotationDetected) +
    Number(tokenReuseDetected) +
    Number(payloadThreatDetected) +
    Number(entropyDetected);

  // ------------------------------------------------
  // Classification
  // ------------------------------------------------

  let attackType: AttackType;
  let confidence: AttackDNA["confidence"];
  let reason: string;

  // Business-flow-only signal
  if (
    businessFlowDetected &&
    abuseSignalCount === 0
  ) {
    attackType = "SENSITIVE_BUSINESS_FLOW";
    confidence = "MEDIUM";
    reason =
      "The request targets a sensitive business flow, but no active abuse signal was detected.";
  }

  // All three existing abuse signals
  else if (
    burstDetected &&
    ipRotationDetected &&
    tokenReuseDetected
  ) {
    attackType = "COORDINATED_API_ABUSE";
    confidence = "HIGH";
    reason =
      "Burst activity, IP rotation, and token reuse were detected simultaneously.";
  }

  // Payload injection detected
  else if (payloadThreatDetected) {
    if (abuseSignalCount >= 2) {
      attackType = "COORDINATED_API_ABUSE";
      confidence = "HIGH";
      reason =
        "Payload injection detected alongside other abuse signals — coordinated attack.";
    } else {
      attackType = "PAYLOAD_INJECTION";
      confidence = "HIGH";
      reason =
        "Malicious payload detected (SQLi, XSS, Command Injection, or Path Traversal).";
    }
  }

  // High entropy / obfuscated payload
  else if (entropyDetected) {
    attackType = "OBFUSCATED_PAYLOAD";
    confidence = "MEDIUM";
    reason =
      "Request contains high-entropy content suggesting encoded or obfuscated payloads.";
  }

  // Multiple abuse signals
  else if (abuseSignalCount >= 2) {
    attackType = "MULTI_SIGNAL_API_ABUSE";
    confidence = "HIGH";
    reason =
      "Multiple independent abuse signals were detected.";
  }

  // Single abuse signal
  else if (burstDetected) {
    attackType = "BURST_ABUSE";
    confidence = "MEDIUM";
    reason =
      "Abnormally high request frequency was detected.";
  }

  else if (ipRotationDetected) {
    attackType = "IP_ROTATION_ABUSE";
    confidence = "MEDIUM";
    reason =
      "Multiple IP addresses were associated with the same client.";
  }

  else if (tokenReuseDetected) {
    attackType = "TOKEN_REUSE_ABUSE";
    confidence = "MEDIUM";
    reason =
      "The same API token was observed across multiple IP addresses.";
  }

  // Business flow + an abuse signal
  else if (businessFlowDetected) {
    attackType = "MULTI_SIGNAL_API_ABUSE";
    confidence = "HIGH";
    reason =
      "An abuse signal was detected while targeting a sensitive business flow.";
  }

  else {
    attackType = "NORMAL_TRAFFIC";
    confidence = "LOW";
    reason = "No recognized abuse pattern was detected.";
  }

  return {
    attackType,
    confidence,
    signals: risk.signals,
    evidence,
    reason,
  };
}