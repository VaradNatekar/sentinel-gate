const requestCounts = new Map<string, number[]>();

const WINDOW_MS = 60_000;

export function recordRequest(clientId: string): number {
  const now = Date.now();

  const timestamps = requestCounts.get(clientId) ?? [];

  const recentRequests = timestamps.filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  recentRequests.push(now);

  requestCounts.set(clientId, recentRequests);

  return recentRequests.length;
}