import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Database, Server, RefreshCw, Trash2, Radio, Eye, Settings2, BarChart2, Target, Zap, List, Settings as SettingsIcon } from 'lucide-react';
import { setSystemMode, runAttackSimulation } from '../services/api';
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
  onCustomClick?: () => void;
  onSettingsClick?: () => void;
  showShortcuts?: boolean;
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
  onCustomClick,
  onSettingsClick,
  showShortcuts,
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
    const isAuto = telemetry?.systemMode === 'AUTO' || !telemetry?.systemMode;

    if (level === 'NORMAL') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono text-xs uppercase tracking-wider font-semibold glow-emerald">
          <ShieldCheck className="w-3.5 h-3.5" />
          Status: PROTECTED (NORMAL)
        </div>
      );
    }

    if (isAuto) {
      // Auto mode blocks threats -> Display as Mitigated
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold shadow-[0_0_10px_rgba(6,182,212,0.4)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          {level} RISK — MITIGATED 🛡️
        </div>
      );
    } else {
      // Observe mode lets threats through -> Display as Vulnerable
      const colorClass = level === 'CRITICAL' 
        ? 'text-rose-400 border-rose-500 bg-rose-500/20 shadow-[0_0_10px_rgba(225,29,72,0.4)] animate-pulse' 
        : level === 'HIGH' 
          ? 'text-amber-400 border-amber-500 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse' 
          : 'text-yellow-400 border-yellow-500 bg-yellow-500/20';

      return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs uppercase tracking-wider font-semibold ${colorClass}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          {level} RISK — VULNERABLE ⚠️
        </div>
      );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0d131f]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
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
              <div className="flex items-center gap-1.5" title="Sentinel Gateway on Port 3200">
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

            {/* Mode Selector - Sleek Pill Design */}
            <div className="flex items-center bg-[#0a0d14] rounded-full p-1 border border-slate-800/80 shadow-inner">
              <button
                onClick={() => setSystemMode('OBSERVE').then(onRefresh)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase font-bold tracking-widest transition-all duration-300 ${
                  telemetry?.systemMode === 'OBSERVE'
                    ? 'bg-gradient-to-r from-rose-950/40 to-transparent text-rose-100 shadow-sm border border-rose-900/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  telemetry?.systemMode === 'OBSERVE' 
                    ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]' 
                    : 'bg-slate-700'
                }`}></span>
                OBSERVE
              </button>
              
              <button
                onClick={() => setSystemMode('AUTO').then(onRefresh)}
                className={`relative flex items-center justify-center px-5 py-2 rounded-full text-[11px] uppercase font-bold tracking-widest transition-all duration-300 -mx-1 ${
                  telemetry?.systemMode === 'AUTO' || !telemetry?.systemMode
                    ? 'bg-gradient-to-b from-slate-700 to-[#1a1c23] border border-slate-500/50 shadow-[0_4px_12px_rgba(0,0,0,0.5)] text-white z-10 scale-105'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {(telemetry?.systemMode === 'AUTO' || !telemetry?.systemMode) && (
                  <div className="absolute top-1 w-3 h-0.5 rounded-full bg-slate-400/50 shadow-[0_0_4px_rgba(255,255,255,0.2)]"></div>
                )}
                INTELLIGENT
              </button>
              
              <button
                onClick={onCustomClick}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase font-bold tracking-widest transition-all duration-300 text-slate-600 hover:text-slate-400 cursor-pointer"
                title="Requires Enterprise License"
              >
                CUSTOM
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700/50"></span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              
              {/* Quick Shortcuts */}
              {showShortcuts && (
                <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-700/50 mr-2 shadow-inner">
                  <button onClick={() => runAttackSimulation('CLEAN_TRAFFIC', () => {}, () => false)} className="p-1.5 rounded-md hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition" title="1. Clean Traffic"><ShieldCheck className="w-4 h-4" /></button>
                  <button onClick={() => runAttackSimulation('BURST_ATTACK', () => {}, () => false)} className="p-1.5 rounded-md hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition" title="2. Burst Attack"><Zap className="w-4 h-4" /></button>
                  <button onClick={() => runAttackSimulation('IP_ROTATION', () => {}, () => false)} className="p-1.5 rounded-md hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition" title="3. IP Rotation"><Radio className="w-4 h-4" /></button>
                  <button onClick={() => runAttackSimulation('TOKEN_REUSE', () => {}, () => false)} className="p-1.5 rounded-md hover:bg-slate-700 text-purple-400 hover:text-purple-300 transition" title="4. Token Reuse"><RefreshCw className="w-4 h-4" /></button>
                  <button onClick={() => runAttackSimulation('PAYLOAD_INJECTION', () => {}, () => false)} className="p-1.5 rounded-md hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition" title="5. Payload Injection"><Target className="w-4 h-4" /></button>
                  <button onClick={() => runAttackSimulation('ENTROPY_PROBE', () => {}, () => false)} className="p-1.5 rounded-md hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition" title="6. Entropy Probe"><List className="w-4 h-4" /></button>
                </div>
              )}

              <button
                onClick={onSettingsClick}
                title="Platform Settings"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition"
              >
                <SettingsIcon className="w-4 h-4" />
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
        <div className="flex w-full items-stretch gap-2 border-t border-slate-800/60 pt-3 pb-1 overflow-x-auto text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-md transition ${
              activeTab === 'overview'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[13px]">📈</span> SECURITY OVERVIEW
          </button>
          
          <span className="text-slate-700 flex items-center font-light">|</span>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-md transition ${
              activeTab === 'simulator'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="relative flex items-center justify-center mr-0.5">
              <span className="absolute w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75"></span>
              <span className="relative w-2 h-2 rounded-full bg-rose-500"></span>
            </div>
            <span className="text-[13px]">🎯</span> ATTACK SIMULATOR
          </button>
          
          <span className="text-slate-700 flex items-center font-light">|</span>

          <button
            onClick={() => setActiveTab('tester')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-md transition ${
              activeTab === 'tester'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[13px]">⚡</span> GATEWAY TESTER
          </button>
          
          <span className="text-slate-700 flex items-center font-light">|</span>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-md transition ${
              activeTab === 'audit'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[13px]">📋</span> LIVE AUDIT LOG
          </button>
          
          <span className="text-slate-700 flex items-center font-light">|</span>

          <button
            onClick={() => setActiveTab('engine')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-md transition ${
              activeTab === 'engine'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[13px]">⚙️</span> DETECTION ENGINE
          </button>
        </div>
      </div>
    </header>
  );
};