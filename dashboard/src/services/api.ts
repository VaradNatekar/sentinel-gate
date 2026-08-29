import { SecurityAuditEntry, SentinelTelemetry, SystemHealth, SimulationResult } from '../types/sentinel';

const GATEWAY_URL = 'http://localhost:3200';

export async function fetchHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/sentinel/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // offline fallback
  }

  return {
    gateway: 'offline',
    redis: 'offline',
    demoApi: 'offline',
    timestamp: new Date().toISOString(),
  };
}

export async function fetchTelemetry(): Promise<SentinelTelemetry | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/sentinel/telemetry`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch telemetry:', err);
  }
  return null;
}

export async function fetchEvents(
  level?: string,
  limit: number = 50
): Promise<{ total: number; events: SecurityAuditEntry[] }> {
  try {
    const url = new URL(`${GATEWAY_URL}/api/sentinel/events`);
    if (level && level !== 'ALL') {
      url.searchParams.set('level', level);
    }
    url.searchParams.set('limit', limit.toString());

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch security events:', err);
  }
  return { total: 0, events: [] };
}

export async function resetSystemState(): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/sentinel/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset system state:', err);
    return false;
  }
}

export async function setSystemMode(mode: 'OBSERVE' | 'AUTO' | 'CUSTOM'): Promise<boolean> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/sentinel/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to set system mode:', err);
    return false;
  }
}

export async function sendProxyRequest(
  endpoint: string,
  options?: {
    method?: string;
    ip?: string;
    token?: string;
    userAgent?: string;
    body?: any;
  }
): Promise<SimulationResult> {
  const startTime = Date.now();
  const headers: Record<string, string> = {};

  if (options?.ip) {
    headers['X-Forwarded-For'] = options.ip;
  }
  if (options?.token) {
    headers['Authorization'] = options.token.startsWith('Bearer ')
      ? options.token
      : `Bearer ${options.token}`;
  }
  if (options?.userAgent) {
    headers['User-Agent'] = options.userAgent;
  }
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const res = await fetch(`${GATEWAY_URL}${sanitizedEndpoint}`, {
      method: options?.method || 'GET',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const durationMs = Date.now() - startTime;
    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    return {
      request: 1,
      ip: options?.ip || '127.0.0.1',
      token: options?.token,
      status: res.status,
      durationMs,
      data,
      riskScore: data?.riskScore,
      riskLevel: data?.riskLevel,
      action: data?.action,
    };
  } catch (error: any) {
    return {
      request: 1,
      ip: options?.ip || '127.0.0.1',
      status: 502,
      durationMs: Date.now() - startTime,
      data: { error: error.message || 'Connection failed' },
    };
  }
}

// Attack Simulation Scenarios
export type AttackPresetType =
  | 'CLEAN_TRAFFIC'
  | 'BURST_ATTACK'
  | 'IP_ROTATION'
  | 'TOKEN_REUSE'
  | 'PAYLOAD_INJECTION'
  | 'ENTROPY_PROBE'
  | 'COMBINED_STORM';

export async function runAttackSimulation(
  preset: AttackPresetType,
  onProgress: (result: SimulationResult, current: number, total: number) => void,
  shouldStop: () => boolean
): Promise<void> {
  switch (preset) {
    case 'CLEAN_TRAFFIC': {
      const count = 10;
      for (let i = 1; i <= count; i++) {
        if (shouldStop()) break;
        const res = await sendProxyRequest('/api/results', {
          ip: '192.168.1.50',
          token: 'clean-user-session',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        });
        res.request = i;
        onProgress(res, i, count);
        await new Promise((r) => setTimeout(r, 150));
      }
      break;
    }

    case 'BURST_ATTACK': {
      // 65 rapid requests from single IP to trip BURST_THRESHOLD (60)
      const count = 65;
      const targetIp = '198.51.100.22';
      for (let i = 1; i <= count; i++) {
        if (shouldStop()) break;
        const res = await sendProxyRequest('/api/results', {
          ip: targetIp,
          userAgent: 'BotNet-Burst-Tool/v2.1',
        });
        res.request = i;
        onProgress(res, i, count);
        await new Promise((r) => setTimeout(r, 40));
      }
      break;
    }

    case 'IP_ROTATION': {
      // Shifting across 4 distinct IPs with same user agent client signature
      const ips = ['10.200.1.1', '10.200.1.2', '10.200.1.3', '10.200.1.4'];
      const requestsPerIp = 15;
      const total = ips.length * requestsPerIp;
      let reqNumber = 1;

      for (const ip of ips) {
        for (let i = 0; i < requestsPerIp; i++) {
          if (shouldStop()) return;
          const res = await sendProxyRequest('/api/results', {
            ip,
            userAgent: 'Distributed-Crawler-Single-Client',
          });
          res.request = reqNumber;
          onProgress(res, reqNumber, total);
          reqNumber++;
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      break;
    }

    case 'TOKEN_REUSE': {
      // Same Bearer token distributed across 3 different external IPs
      const sharedToken = 'Bearer compromised-executive-token';
      const ips = ['172.16.50.10', '172.16.50.20', '172.16.50.30'];
      const countPerIp = 12;
      const total = ips.length * countPerIp;
      let reqNumber = 1;

      for (const ip of ips) {
        for (let i = 0; i < countPerIp; i++) {
          if (shouldStop()) return;
          const res = await sendProxyRequest('/api/profile', {
            ip,
            token: sharedToken,
            userAgent: `MobileClient-App-${ip.replace(/\./g, '')}`,
          });
          res.request = reqNumber;
          onProgress(res, reqNumber, total);
          reqNumber++;
          await new Promise((r) => setTimeout(r, 60));
        }
      }
      break;
    }

    case 'COMBINED_STORM': {
      // High volume multi-IP, token reuse, and burst storm
      const ips = ['10.0.0.1', '10.0.0.2', '10.0.0.3'];
      const requestsPerIp = 40;
      const total = ips.length * requestsPerIp;
      let reqNumber = 1;

      for (const ip of ips) {
        for (let i = 0; i < requestsPerIp; i++) {
          if (shouldStop()) return;
          const res = await sendProxyRequest('/api/results', {
            ip,
            token: 'demo-token',
            userAgent: 'Sentinel-Simulator-AttackSuite',
          });
          res.request = reqNumber;
          onProgress(res, reqNumber, total);
          reqNumber++;
          await new Promise((r) => setTimeout(r, 45));
        }
      }
      break;
    }

    case 'PAYLOAD_INJECTION': {
      // Diverse injection attacks: SQLi, XSS, Command Injection, Path Traversal
      const payloads = [
        { method: 'GET', path: '/api/search?q=1%27%20OR%201=1--', desc: 'SQLi (basic OR bypass)' },
        { method: 'POST', path: '/api/login', body: { username: "admin' OR '1'='1", password: "test" }, desc: 'SQLi (login bypass)' },
        { method: 'POST', path: '/api/results', body: { name: '<script>document.cookie</script>' }, desc: 'XSS (script tag)' },
        { method: 'POST', path: '/api/results', body: { data: '<img src=x onerror=alert(1)>' }, desc: 'XSS (img onerror)' },
        { method: 'GET', path: '/api/results?file=../../../../etc/passwd', desc: 'Path Traversal' },
        { method: 'POST', path: '/api/results', body: { cmd: '; cat /etc/passwd' }, desc: 'Command Injection' },
        { method: 'POST', path: '/api/results', body: { query: "SELECT * FROM users; DROP TABLE users;--" }, desc: 'SQLi (DROP TABLE)' },
        { method: 'POST', path: '/api/results', body: { input: 'UNION SELECT username, password FROM admin_users--' }, desc: 'SQLi (UNION attack)' },
        { method: 'POST', path: '/api/payment', body: { amount: "100; WAITFOR DELAY '0:0:5'" }, desc: 'SQLi Time-based blind (critical endpoint)' },
        { method: 'POST', path: '/api/results', body: { template: '{{7*7}}' }, desc: 'SSTI (Template Injection)' },
      ];
      const total = payloads.length;
      for (let i = 0; i < total; i++) {
        if (shouldStop()) break;
        const p = payloads[i];
        const res = await sendProxyRequest(p.path, {
          method: p.method,
          ip: '203.0.113.66',
          userAgent: 'Sentinel-PayloadTest/1.0',
          body: p.body,
        });
        res.request = i + 1;
        onProgress(res, i + 1, total);
        await new Promise((r) => setTimeout(r, 300));
      }
      break;
    }

    case 'ENTROPY_PROBE': {
      // Sends payloads with increasing entropy to test obfuscation detection
      const probes = [
        { data: 'Hello, this is normal text with low entropy.', desc: 'Normal text (low entropy)' },
        { data: 'dXNlcm5hbWU9YWRtaW4mcGFzc3dvcmQ9JTI3JTIwT1IlMjAlMjcxJTI3PSUyNzE=', desc: 'Base64-encoded SQLi' },
        { data: '4d5a90000300000004000000ffff0000b80000000000000040000000000000003c2f7363726970743e', desc: 'Hex-encoded payload' },
        { data: 'aGVsbG8gd29ybGQgZnJvbSBhIGJhc2U2NCBlbmNvZGVkIHBheWxvYWQ=', desc: 'Base64 text' },
        { data: 'x9fK2Lj7pQ3mRvYw8sTnBc0ZeOdAiHuXl4VgEkJ6NhDqFP5UM1arWyCbSoGIt', desc: 'High randomness string' },
      ];
      const total = probes.length;
      for (let i = 0; i < total; i++) {
        if (shouldStop()) break;
        const p = probes[i];
        const res = await sendProxyRequest('/api/results', {
          method: 'POST',
          ip: '198.51.100.77',
          userAgent: 'Entropy-Probe/2.0',
          body: { payload: p.data, description: p.desc },
        });
        res.request = i + 1;
        onProgress(res, i + 1, total);
        await new Promise((r) => setTimeout(r, 400));
      }
      break;
    }
  }
}
