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
    return {
      detected: true,
      score: 30,
      reason: `High request frequency: ${requestsLastMinute} requests/minute`,
    };
  }

  return {
    detected: false,
    score: 0,
  };
}