import redisClient from "./redisClient.js";

const WINDOW_SECONDS = 60;

export async function recordRequest(clientId: string): Promise<number> {
  const key = `requests:${clientId}`;

  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }

  return count;
}