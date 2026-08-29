const BURST_THRESHOLD = 60;

export interface BurstDetectionResult {
  detected: boolean;
  score: number;
  reason?: string;
}

export function detectBurst(
  requestsLastMinute: number
): BurstDetectionResult {
  if (requestsLastMinute >= BURST_THRESHOLD) {
    // Scaling penalty: Base score of 20, plus 1.5 points for every request over 50. Max 100.
    const score = Math.min(100, Math.floor(20 + ((requestsLastMinute - 50) * 1.5)));
    return {
      detected: true,
      score,
      reason: `High request frequency: ${requestsLastMinute} requests/minute`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}