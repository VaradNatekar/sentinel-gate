import redisClient from "./redisClient.js";

const MAX_TOKEN_IPS = 2;
const TRACKING_TTL_SECONDS = 300;

export interface TokenReuseResult {
  detected: boolean;
  score: number;
  reason?: string;
}

export async function detectTokenReuse(
  token: string | undefined,
  ip: string
): Promise<TokenReuseResult> {
  if (!token) {
    return {
      detected: false,
      score: 0,
    };
  }

  const key = `tokenReuse:${token}`;

  const added = await redisClient.sAdd(key, ip);

  if (added === 1) {
    await redisClient.expire(key, TRACKING_TTL_SECONDS);
  }

  const ipCount = await redisClient.sCard(key);

  if (ipCount >= MAX_TOKEN_IPS) {
    // Scaling penalty: 10 points + 20 for each IP over 1
    const score = Math.min(100, 10 + ((ipCount - 1) * 20));
    return {
      detected: true,
      score,
      reason: `API token reused across ${ipCount} IPs`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}