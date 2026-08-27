import React from 'react';
import { Zap, Users, KeyRound, ShieldAlert, Cpu, CheckCircle2, ArrowRight, Gauge } from 'lucide-react';
import { SentinelTelemetry } from '../types/sentinel';

interface DetectionEngineViewProps {
  telemetry: SentinelTelemetry | null;
}

export const DetectionEngineView: React.FC<DetectionEngineViewProps> = ({ telemetry }) => {
  const burstTriggered = telemetry?.signalsTriggered.burst || 0;
  const rotationTriggered = telemetry?.signalsTriggered.ipRotation || 0;
  const tokenReuseTriggered = telemetry?.signalsTriggered.tokenReuse || 0;
  const activeRedisKeys = telemetry?.activeRedisKeys || 0;
  const trackedIps = telemetry?.trackedIps || [];

  return (
    <div className="space-y-6">
      {/* Engine Overview Header */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-[#0d131f] to-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Vector Behavioral Threat Detection Engine
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates concurrent heuristics per request, computes composite risk scores, and dynamically enforces mitigation policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Tracked Rate Limits: </span>
              <span className="font-bold text-cyan-400">{trackedIps.length} IPs</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Active Redis Keys: </span>
              <span className="font-bold text-indigo-400">{activeRedisKeys}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Signal Heuristics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Burst Detector */}
        <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md hover:border-amber-500/30 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">1. Burst Spike Detector</h3>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold">+30 Risk Score</span>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                Window: 60s
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Detects volumetric spikes where a single client IP issues requests beyond normal human consumption velocity.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Threshold:</span>
                <span className="text-amber-400 font-semibold">≥ 60 req / min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Key:</span>
                <span className="text-slate-300">requests:&lt;ip&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Times Triggered:</span>
                <span className="text-white font-bold">{burstTriggered}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fast atomic INCR
            </span>
            <span className="font-mono text-slate-500">TTL 60s</span>
          </div>
        </div>

        {/* 2. IP Rotation Detector */}
        <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md hover:border-purple-500/30 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">2. IP Rotation Detector</h3>
                  <span className="text-[10px] font-mono text-purple-400 font-semibold">+25 Risk Score</span>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                Window: 300s
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Detects distributed botnets and rotating proxy attacks where the same client fingerprint (User-Agent or Token) cycles through multiple distinct IP addresses.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Threshold:</span>
                <span className="text-purple-400 font-semibold">≥ 3 distinct IPs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Key:</span>
                <span className="text-slate-300">ipRotation:&lt;clientKey&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Times Triggered:</span>
                <span className="text-white font-bold">{rotationTriggered}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Redis Set (sAdd / sCard)
            </span>
            <span className="font-mono text-slate-500">TTL 300s</span>
          </div>
        </div>

        {/* 3. Token Reuse Detector */}
        <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md hover:border-rose-500/30 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">3. Token Reuse Detector</h3>
                  <span className="text-[10px] font-mono text-rose-400 font-semibold">+20 Risk Score</span>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                Window: 300s
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Identifies compromised API tokens or session hijacking by detecting the identical Bearer token sent concurrently from multiple divergent geographic IPs.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Threshold:</span>
                <span className="text-rose-400 font-semibold">≥ 2 distinct IPs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Key:</span>
                <span className="text-slate-300">tokenReuse:&lt;token&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Times Triggered:</span>
                <span className="text-white font-bold">{tokenReuseTriggered}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Credential Stuffing Guard
            </span>
            <span className="font-mono text-slate-500">TTL 300s</span>
          </div>
        </div>
      </div>

      {/* Risk Engine Scoring & Enforcement Policy Table */}
      <div className="p-5 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Risk Engine Scoring & Action Policy</h3>
            <p className="text-xs text-slate-400">Calculated as Score = min(100, Σ triggered signal scores)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-y border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Score Range</th>
                <th className="py-2.5 px-4">Risk Classification</th>
                <th className="py-2.5 px-4">Enforcement Action</th>
                <th className="py-2.5 px-4">HTTP Response</th>
                <th className="py-2.5 px-4">Scenario Trigger Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-bold text-emerald-400">0 – 30</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    NORMAL
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-white">ALLOW</td>
                <td className="py-3 px-4 text-emerald-400">200 OK (Proxied)</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Single IP, low request rates, legitimate token usage</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-bold text-yellow-400">31 – 60</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    SUSPICIOUS
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-yellow-400">MONITOR</td>
                <td className="py-3 px-4 text-emerald-400">200 OK (Logged)</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Minor rate burst OR initial token reuse detected</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-bold text-amber-400">61 – 80</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    HIGH
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-amber-400">THROTTLE</td>
                <td className="py-3 px-4 text-amber-400">429 Too Many Requests</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Burst (30) + IP Rotation (25) + Token Reuse (20) = 75</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-3 px-4 font-bold text-rose-400">81 – 100</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    CRITICAL
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-rose-400">BLOCK</td>
                <td className="py-3 px-4 text-rose-400">403 Forbidden</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Sustained attack storm with multiple overlapping violations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
