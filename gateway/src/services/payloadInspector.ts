/**
 * Payload Threat Inspector
 * 
 * Scans request body, query parameters, headers, and URL path for
 * common injection attack patterns: SQLi, XSS, Command Injection,
 * Path Traversal, LDAP Injection, and Template Injection.
 * 
 * This is the single most important security feature for an API gateway.
 */

export interface PayloadThreat {
  type: string;
  pattern: string;
  location: string;   // 'body' | 'query' | 'path' | 'header'
  matchedValue: string;
}

export interface PayloadInspectionResult {
  detected: boolean;
  score: number;
  threats: PayloadThreat[];
  reason?: string;
}

// -------------------------------------------------------
// Injection Pattern Definitions
// -------------------------------------------------------

interface PatternRule {
  type: string;
  regex: RegExp;
  score: number;   // base contribution to risk
}

const SQL_INJECTION_PATTERNS: PatternRule[] = [
  { type: "SQLi", regex: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|UNION)\b\s+(ALL\s+)?)/i, score: 35 },
  { type: "SQLi", regex: /(\bOR\b\s+\d+\s*=\s*\d+)/i, score: 30 },
  { type: "SQLi", regex: /(\bAND\b\s+\d+\s*=\s*\d+)/i, score: 25 },
  { type: "SQLi", regex: /(--|#|\/\*)\s*/i, score: 15 },
  { type: "SQLi", regex: /('\s*(OR|AND)\s+')/i, score: 30 },
  { type: "SQLi", regex: /(\bUNION\b\s+\bSELECT\b)/i, score: 40 },
  { type: "SQLi", regex: /(;\s*(DROP|DELETE|INSERT|UPDATE)\b)/i, score: 40 },
  { type: "SQLi", regex: /(\bSLEEP\s*\(\s*\d+\s*\))/i, score: 35 },
  { type: "SQLi", regex: /(\bBENCHMARK\s*\()/i, score: 35 },
  { type: "SQLi", regex: /(\bWAITFOR\s+DELAY\b)/i, score: 35 },
];

const XSS_PATTERNS: PatternRule[] = [
  { type: "XSS", regex: /<\s*script[\s>]/i, score: 35 },
  { type: "XSS", regex: /\bon\w+\s*=\s*["']?[^"']*["']?/i, score: 25 },
  { type: "XSS", regex: /javascript\s*:/i, score: 30 },
  { type: "XSS", regex: /<\s*img[^>]+onerror\s*=/i, score: 30 },
  { type: "XSS", regex: /<\s*svg[^>]+onload\s*=/i, score: 30 },
  { type: "XSS", regex: /<\s*iframe/i, score: 25 },
  { type: "XSS", regex: /\beval\s*\(/i, score: 25 },
  { type: "XSS", regex: /\bdocument\.(cookie|location|write)/i, score: 30 },
];

const CMD_INJECTION_PATTERNS: PatternRule[] = [
  { type: "CMDi", regex: /[;&|`$]\s*(cat|ls|dir|whoami|id|uname|wget|curl|nc|ncat|bash|sh|cmd|powershell)\b/i, score: 35 },
  { type: "CMDi", regex: /\$\(\s*(cat|ls|whoami|id|uname)\b/i, score: 35 },
  { type: "CMDi", regex: /`\s*(cat|ls|whoami|id|uname)\b/i, score: 30 },
  { type: "CMDi", regex: /\|\s*(cat|ls|whoami|id|uname|head|tail|grep)\b/i, score: 30 },
];

const PATH_TRAVERSAL_PATTERNS: PatternRule[] = [
  { type: "PathTraversal", regex: /\.\.\//g, score: 25 },
  { type: "PathTraversal", regex: /\.\.\\/, score: 25 },
  { type: "PathTraversal", regex: /%2e%2e(%2f|%5c)/i, score: 30 },
  { type: "PathTraversal", regex: /\/etc\/(passwd|shadow|hosts)/i, score: 35 },
  { type: "PathTraversal", regex: /\/proc\/self\//i, score: 35 },
  { type: "PathTraversal", regex: /\\windows\\system32/i, score: 35 },
];

const LDAP_INJECTION_PATTERNS: PatternRule[] = [
  { type: "LDAPi", regex: /[()&|!*\\]\s*(\||\&)\s*\(/i, score: 25 },
];

const TEMPLATE_INJECTION_PATTERNS: PatternRule[] = [
  { type: "SSTI", regex: /\{\{.*\}\}/i, score: 20 },
  { type: "SSTI", regex: /\$\{.*\}/i, score: 20 },
  { type: "SSTI", regex: /<%.*%>/i, score: 25 },
];

const ALL_PATTERNS: PatternRule[] = [
  ...SQL_INJECTION_PATTERNS,
  ...XSS_PATTERNS,
  ...CMD_INJECTION_PATTERNS,
  ...PATH_TRAVERSAL_PATTERNS,
  ...LDAP_INJECTION_PATTERNS,
  ...TEMPLATE_INJECTION_PATTERNS,
];

// -------------------------------------------------------
// Scanner
// -------------------------------------------------------

function scanValue(
  value: string,
  location: string
): PayloadThreat[] {
  const threats: PayloadThreat[] = [];

  for (const rule of ALL_PATTERNS) {
    if (rule.regex.test(value)) {
      threats.push({
        type: rule.type,
        pattern: rule.regex.source.substring(0, 60),
        location,
        matchedValue: value.substring(0, 120),
      });
    }
  }

  return threats;
}

function flattenObject(
  obj: any,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};

  if (obj === null || obj === undefined) return result;

  if (typeof obj === "string") {
    result[prefix || "value"] = obj;
    return result;
  }

  if (typeof obj !== "object") {
    result[prefix || "value"] = String(obj);
    return result;
  }

  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof val === "string") {
      result[fullKey] = val;
    } else if (typeof val === "object" && val !== null) {
      Object.assign(result, flattenObject(val, fullKey));
    } else if (val !== undefined && val !== null) {
      result[fullKey] = String(val);
    }
  }

  return result;
}

// -------------------------------------------------------
// Main Inspection Function
// -------------------------------------------------------

export function inspectPayload(
  path: string,
  queryParams: Record<string, any>,
  body: any,
  headers: Record<string, string | string[] | undefined>
): PayloadInspectionResult {
  const allThreats: PayloadThreat[] = [];

  // 1. Scan URL path
  allThreats.push(...scanValue(decodeURIComponent(path), "path"));

  // 2. Scan query parameters
  const flatQuery = flattenObject(queryParams);
  for (const [_key, val] of Object.entries(flatQuery)) {
    try {
      allThreats.push(
        ...scanValue(decodeURIComponent(val), "query")
      );
    } catch {
      allThreats.push(...scanValue(val, "query"));
    }
  }

  // 3. Scan request body
  if (body) {
    const flatBody = flattenObject(body);
    for (const [_key, val] of Object.entries(flatBody)) {
      try {
        allThreats.push(
          ...scanValue(decodeURIComponent(val), "body")
        );
      } catch {
        allThreats.push(...scanValue(val, "body"));
      }
    }
  }

  // 4. Scan select headers (Authorization, Referer, Cookie — common injection vectors)
  const sensitiveHeaders = ["authorization", "referer", "cookie", "x-forwarded-for"];
  for (const headerName of sensitiveHeaders) {
    const headerVal = headers[headerName];
    if (headerVal) {
      const val = Array.isArray(headerVal) ? headerVal.join(", ") : headerVal;
      allThreats.push(...scanValue(val, "header"));
    }
  }

  // Deduplicate by type+location
  const seen = new Set<string>();
  const uniqueThreats = allThreats.filter((t) => {
    const key = `${t.type}:${t.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueThreats.length === 0) {
    return { detected: false, score: 0, threats: [] };
  }

  // Score: take the highest single threat score + 10 per additional unique threat type
  const uniqueTypes = new Set(uniqueThreats.map((t) => t.type));
  const maxSingleScore = Math.max(
    ...ALL_PATTERNS
      .filter((rule) =>
        uniqueThreats.some((t) => t.type === rule.type && rule.regex.test(t.matchedValue))
      )
      .map((r) => r.score),
    20 // floor
  );

  const score = Math.min(100, maxSingleScore + (uniqueTypes.size - 1) * 10);

  const typeList = Array.from(uniqueTypes).join(", ");

  return {
    detected: true,
    score,
    threats: uniqueThreats,
    reason: `Payload injection detected: ${typeList} (${uniqueThreats.length} pattern${uniqueThreats.length > 1 ? "s" : ""} matched)`,
  };
}
