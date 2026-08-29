/**
 * Request Entropy Analyzer
 * 
 * Calculates Shannon entropy of request payloads to detect
 * encoded, obfuscated, or encrypted attack payloads.
 * 
 * High entropy in user-supplied fields suggests base64-encoded exploits,
 * hex-encoded shellcode, or obfuscated injection attempts.
 * 
 * This is a genuinely novel detection signal that most WAFs don't implement.
 */

export interface EntropyAnalysisResult {
  detected: boolean;
  score: number;
  entropy: number;
  reason?: string;
}

// Shannon entropy threshold: normal text is ~3.5-4.5 bits/char
// Base64 encoded data is ~5.5-6.0
// Random/encrypted data is ~7.0-8.0
const HIGH_ENTROPY_THRESHOLD = 5.5;
const CRITICAL_ENTROPY_THRESHOLD = 6.5;
const MIN_LENGTH_FOR_ANALYSIS = 24; // Don't analyze very short strings

/**
 * Calculate Shannon entropy (bits per character) of a string.
 */
function shannonEntropy(str: string): number {
  if (str.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;

  for (const count of freq.values()) {
    const p = count / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Flatten and extract all string values from an object for entropy analysis.
 */
function extractStrings(obj: any): string[] {
  const result: string[] = [];

  if (obj === null || obj === undefined) return result;

  if (typeof obj === "string") {
    result.push(obj);
    return result;
  }

  if (typeof obj !== "object") return result;

  for (const val of Object.values(obj)) {
    if (typeof val === "string") {
      result.push(val);
    } else if (typeof val === "object" && val !== null) {
      result.push(...extractStrings(val));
    }
  }

  return result;
}

/**
 * Analyze request payload for high entropy content.
 */
export function analyzeEntropy(
  queryParams: Record<string, any>,
  body: any
): EntropyAnalysisResult {
  const allStrings: string[] = [];

  // Collect from query params
  allStrings.push(...extractStrings(queryParams));

  // Collect from body
  if (body) {
    allStrings.push(...extractStrings(body));
  }

  // Filter: only analyze strings long enough to be meaningful
  const candidates = allStrings.filter(
    (s) => s.length >= MIN_LENGTH_FOR_ANALYSIS
  );

  if (candidates.length === 0) {
    return { detected: false, score: 0, entropy: 0 };
  }

  // Find the highest entropy value across all fields
  let maxEntropy = 0;
  for (const str of candidates) {
    const e = shannonEntropy(str);
    if (e > maxEntropy) {
      maxEntropy = e;
    }
  }

  // Round for readability
  maxEntropy = Math.round(maxEntropy * 100) / 100;

  if (maxEntropy >= CRITICAL_ENTROPY_THRESHOLD) {
    return {
      detected: true,
      score: Math.min(100, Math.floor(25 + (maxEntropy - CRITICAL_ENTROPY_THRESHOLD) * 20)),
      entropy: maxEntropy,
      reason: `Critical entropy detected: ${maxEntropy} bits/char (possible encoded/encrypted payload)`,
    };
  }

  if (maxEntropy >= HIGH_ENTROPY_THRESHOLD) {
    return {
      detected: true,
      score: Math.min(50, Math.floor(15 + (maxEntropy - HIGH_ENTROPY_THRESHOLD) * 10)),
      entropy: maxEntropy,
      reason: `High entropy detected: ${maxEntropy} bits/char (possible obfuscated content)`,
    };
  }

  return {
    detected: false,
    score: 0,
    entropy: maxEntropy,
  };
}
