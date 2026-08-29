import React from 'react';
import { ShieldCheck, Flame, Ban, Zap, AlertTriangle, Users, Key } from 'lucide-react';
import { SentinelTelemetry } from '../types/sentinel';

interface MetricCardsProps {
  telemetry: SentinelTelemetry | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ telemetry }) => {
  const total = telemetry?.totalRequests || 0;
  const allowed = telemetry?.allowedRequests || 0;
  const monitored = telemetry?.monitoredRequests || 0;
  const throttled = telemetry?.throttledRequests || 0;
  const blocked = telemetry?.blockedRequests || 0;
  const peakRisk = telemetry?.peakRisk || 0;
  const burstCount = telemetry?.signalsTriggered?.burst || 0;
  const rotationCount = telemetry?.signalsTriggered?.ipRotation || 0;
  const tokenReuseCount = telemetry?.signalsTriggered?.tokenReuse || 0;

  const getRiskColor = (score: number) => {
    if (score > 80) return 'text-rose-500 border-rose-500/40 bg-rose-500/10';
    if (score > 60) return 'text-amber-500 border-amber-500/40 bg-amber-500/10';
    if (score > 30) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Protected Requests */}
      <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Requests
          </span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-white">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">evaluated</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="text-emerald-400">Allowed: {allowed}</span>
          <span className="text-yellow-400">Monitored: {monitored}</span>
        </div>
      </div>

      {/* 2. Peak Threat Score */}
      <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Peak Threat Score
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono ${peakRisk > 60 ? 'text-rose-400' : peakRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {peakRisk}
          </span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              peakRisk > 80 ? 'bg-rose-500' : peakRisk > 60 ? 'bg-amber-500' : peakRisk > 30 ? 'bg-yellow-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, peakRisk))}%` }}
          ></div>
        </div>
        <div className="mt-2 text-right">
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getRiskColor(peakRisk)}`}>
            {peakRisk > 80 ? 'CRITICAL RISK' : peakRisk > 60 ? 'HIGH RISK' : peakRisk > 30 ? 'SUSPICIOUS' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* 3. Throttled & Blocked (Enforced) */}
      <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Enforced Mitigations
          </span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Ban className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-rose-400">
            {(throttled + blocked).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">requests</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
          <span className="text-amber-400" title="HTTP 429 Too Many Requests">
            Throttled: {throttled}
          </span>
          <span className="text-rose-400" title="HTTP 403 Forbidden Blocked">
            Blocked: {blocked}
          </span>
        </div>
      </div>

      {/* 4. Threat Vector Breakdown */}
      <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Threat Signals Triggered
          </span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-indigo-300">
            {burstCount + rotationCount + tokenReuseCount}
          </span>
          <span className="text-xs text-slate-400">signals</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] font-mono text-center pt-2 border-t border-slate-800/80">
          <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Burst rate spikes detected">
            <div className="text-slate-400 text-[9px]">Burst</div>
            <div className="font-bold text-amber-400">{burstCount}</div>
          </div>
          <div className="p-1 rounded bg-slate-900 border border-slate-800" title="IP Rotation attacks detected">
            <div className="text-slate-400 text-[9px]">IP Rot.</div>
            <div className="font-bold text-purple-400">{rotationCount}</div>
          </div>
          <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Token reuse across multiple IPs">
            <div className="text-slate-400 text-[9px]">Auth Abuse</div>
            <div className="font-bold text-rose-400">{tokenReuseCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
