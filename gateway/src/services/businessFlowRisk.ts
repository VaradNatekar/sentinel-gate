export type BusinessFlowLevel = "LOW" | "HIGH" | "CRITICAL";

export interface BusinessFlowRisk {
  level: BusinessFlowLevel;
  score: number;
  reason: string;
}

const BUSINESS_FLOW_RULES: Array<{
  pattern: RegExp;
  level: BusinessFlowLevel;
  score: number;
}> = [
  {
    pattern: /^\/api\/payment(?:\/|$)/,
    level: "CRITICAL",
    score: 30,
  },
  {
    pattern: /^\/api\/reset-password(?:\/|$)/,
    level: "CRITICAL",
    score: 30,
  },
  {
    pattern: /^\/api\/admin(?:\/|$)/,
    level: "CRITICAL",
    score: 30,
  },
  {
    pattern: /^\/api\/login(?:\/|$)/,
    level: "HIGH",
    score: 15,
  },
  {
    pattern: /^\/api\/(search|products)(?:\/|$)/,
    level: "LOW",
    score: 0,
  },
];

export function detectBusinessFlowRisk(
  path: string
): BusinessFlowRisk {
  const rule = BUSINESS_FLOW_RULES.find((item) =>
    item.pattern.test(path)
  );

  if (!rule) {
    return {
      level: "LOW",
      score: 0,
      reason: "No sensitive business flow rule matched.",
    };
  }

  if (rule.level === "LOW") {
    return {
      level: "LOW",
      score: 0,
      reason: "Low-sensitivity business flow.",
    };
  }

  return {
    level: rule.level,
    score: rule.score,
    reason:
      rule.level === "CRITICAL"
        ? "Request targets a critical business flow."
        : "Request targets a high-sensitivity business flow.",
  };
}