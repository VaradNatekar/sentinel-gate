import redisClient from "./redisClient.js";

const MAX_TRACKED_IPS = 3;
const TRACKING_TTL_SECONDS = 300;

export interface IPRotationResult {
  detected: boolean;
  score: number;
  reason?: string;
}

export async function detectIPRotation(
  clientKey: string,
  ip: string
): Promise<IPRotationResult> {
  const key = `ipRotation:${clientKey}`;

  const added = await redisClient.sAdd(key, ip);

  if (added === 1) {
    await redisClient.expire(key, TRACKING_TTL_SECONDS);
  }

  const ipCount = await redisClient.sCard(key);

  if (ipCount >= MAX_TRACKED_IPS) {
    // Scaling penalty: 15 points + 15 for each IP over 2
    const score = Math.min(100, 15 + ((ipCount - 2) * 15));
    return {
      detected: true,
      score,
      reason: `IP Rotation detected across ${ipCount} IPs`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}