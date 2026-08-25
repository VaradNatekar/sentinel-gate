const MAX_TRACKED_IPS = 3;

const clientIps = new Map<string, Set<string>>();

export interface IPRotationResult {
  detected: boolean;
  score: number;
  reason?: string;
}

export function detectIPRotation(
  clientKey: string,
  ip: string
): IPRotationResult {
  const ips = clientIps.get(clientKey) ?? new Set<string>();

  ips.add(ip);

  clientIps.set(clientKey, ips);

  if (ips.size >= MAX_TRACKED_IPS) {
    return {
      detected: true,
      score: 25,
      reason: `Multiple IPs detected for the same client: ${ips.size}`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}