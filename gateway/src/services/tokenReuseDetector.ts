const MAX_TOKEN_IPS = 2;

const tokenIps = new Map<string, Set<string>>();

export interface TokenReuseResult {
  detected: boolean;
  score: number;
  reason?: string;
}

export function detectTokenReuse(
  token: string | undefined,
  ip: string
): TokenReuseResult {
  if (!token) {
    return {
      detected: false,
      score: 0,
    };
  }

  const ips = tokenIps.get(token) ?? new Set<string>();

  ips.add(ip);

  tokenIps.set(token, ips);

  if (ips.size >= MAX_TOKEN_IPS) {
    return {
      detected: true,
      score: 20,
      reason: `API token reused across ${ips.size} IPs`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}
