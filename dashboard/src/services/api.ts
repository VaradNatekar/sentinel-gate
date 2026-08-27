import { SecurityAuditEntry, SentinelTelemetry, SystemHealth, SimulationResult } from '../types/sentinel';

const GATEWAY_URL = 'http://localhost:3000';

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
  }
}
