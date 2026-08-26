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
    return {
      detected: true,
      score: 25,
      reason: `Multiple IPs detected for the same client: ${ipCount}`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}