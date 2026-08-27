import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Database, Server, RefreshCw, Trash2, Radio } from 'lucide-react';
import { SystemHealth, SentinelTelemetry, RiskLevel } from '../types/sentinel';

interface HeaderProps {
  health: SystemHealth;
  telemetry: SentinelTelemetry | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onReset: () => void;
  isResetting: boolean;
  activeTab: 'overview' | 'simulator' | 'tester' | 'engine' | 'audit';
  setActiveTab: (tab: 'overview' | 'simulator' | 'tester' | 'engine' | 'audit') => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  telemetry,
  isRefreshing,
  onRefresh,
  onReset,
  isResetting,
  activeTab,
  setActiveTab,
}) => {
  // Determine overall threat level from recent telemetry
  let overallLevel: RiskLevel = 'NORMAL';
  if (telemetry) {
    if (telemetry.riskDistribution.CRITICAL > 0 || telemetry.peakRisk > 80) {
      overallLevel = 'CRITICAL';
    } else if (telemetry.riskDistribution.HIGH > 0 || telemetry.peakRisk > 60) {
      overallLevel = 'HIGH';
    } else if (telemetry.riskDistribution.SUSPICIOUS > 0 || telemetry.peakRisk > 30) {
      overallLevel = 'SUSPICIOUS';
    }
  }

  const getThreatBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 font-mono text-xs uppercase tracking-wider font-semibold glow-rose animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Threat Level: CRITICAL
          </div>
        );
      case 'HIGH':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold glow-amber">
            <ShieldAlert className="w-3.5 h-3.5" />
            Threat Level: HIGH
          </div>
        );
      case 'SUSPICIOUS':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500 text-yellow-300 font-mono text-xs uppercase tracking-wider font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Threat Level: SUSPICIOUS
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold glow-emerald">
            <ShieldCheck className="w-3.5 h-3.5" />
            Status: PROTECTED (NORMAL)
          </div>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0d131f]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Shield className="w-6 h-6 animate-pulse-slow" />
              <div className="absolute inset-0 rounded-xl border border-cyan-400/30 blur-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                  SENTINEL GATE
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                  SOC v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-Time API Security Gateway & Automated Threat Defense
              </p>
            </div>
          </div>

          {/* System Services Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-1.5" title="Sentinel Gateway on Port 3000">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Gateway:</span>
                <span className={health.gateway === 'online' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {health.gateway.toUpperCase()}
                </span>
              </div>

              <span className="text-slate-700">|</span>

              <div className="flex items-center gap-1.5" title="Redis Cache on Port 6379">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Redis:</span>
                <span className={health.redis === 'online' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {health.redis.toUpperCase()}
                </span>
              </div>

              <span className="text-slate-700">|</span>

              <div className="flex items-center gap-1.5" title="Protected Backend Demo API on Port 4000">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400">Demo API:</span>
                <span className={health.demoApi === 'online' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {health.demoApi.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Threat Badge */}
            {getThreatBadge(overallLevel)}

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Telemetry"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>

              <button
                onClick={onReset}
                disabled={isResetting}
                title="Reset Redis Threat Keys and Audit Buffer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 text-xs font-semibold transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Threat State</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/60 pt-2 pb-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-md transition ${
              activeTab === 'overview'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            📊 Security Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            ⚔️ Attack Simulator Studio
          </button>
          <button
            onClick={() => setActiveTab('engine')}
            className={`px-3.5 py-1.5 rounded-md transition ${
              activeTab === 'engine'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            🛡️ Detection Engine & Rules
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3.5 py-1.5 rounded-md transition ${
              activeTab === 'tester'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            ⚡ API Gateway Proxy Tester
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-md transition ${
              activeTab === 'audit'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            📜 Live Audit Log Feed
          </button>
        </div>
      </div>
    </header>
  );
};
