import React, { useState, useRef } from 'react';
import {
  Play,
  Square,
  Flame,
  Zap,
  Users,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { runAttackSimulation, AttackPresetType } from '../services/api';
import { SimulationResult } from '../types/sentinel';

interface AttackSimulatorStudioProps {
  onSimulationCompleted?: () => void;
}

export const AttackSimulatorStudio: React.FC<AttackSimulatorStudioProps> = ({
  onSimulationCompleted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<AttackPresetType | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<SimulationResult[]>([]);
  const shouldStopRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const startSimulation = async (preset: AttackPresetType) => {
    if (isRunning) return;

    setIsRunning(true);
    setActivePreset(preset);
    setProgress({ current: 0, total: 100 });
    setLogs([]);
    shouldStopRef.current = false;

    try {
      await runAttackSimulation(
        preset,
        (result, current, total) => {
          setProgress({ current, total });
          setLogs((prev) => [result, ...prev.slice(0, 99)]);
        },
        () => shouldStopRef.current
      );
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
      setActivePreset(null);
      if (onSimulationCompleted) {
        onSimulationCompleted();
      }
    }
  };

  const stopSimulation = () => {
    shouldStopRef.current = true;
    setIsRunning(false);
    setActivePreset(null);
  };

  const clearLogs = () => {
    setLogs([]);
    setProgress({ current: 0, total: 0 });
  };

  const presets = [
    {
      id: 'CLEAN_TRAFFIC' as AttackPresetType,
      title: '1. Legitimate Traffic Profile',
      badge: 'NORMAL (200 OK)',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      description: 'Sends 10 steady requests from a single client IP (192.168.1.50) with valid user headers.',
      signals: 'None (Score: 0 -> ALLOW)',
      requests: '10 requests',
    },
    {
      id: 'BURST_ATTACK' as AttackPresetType,
      title: '2. Volumetric Burst Attack',
      badge: 'BURST TRIGGER (Score +30)',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Zap,
      iconColor: 'text-amber-400',
      description: 'Fires 65 rapid requests from a single IP to breach the 60 req/min threshold in 2 seconds.',
      signals: 'Burst (>60 reqs/min -> MONITOR)',
      requests: '65 requests',
    },
    {
      id: 'IP_ROTATION' as AttackPresetType,
      title: '3. Distributed IP Rotation',
      badge: 'IP ROTATION (+25)',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Users,
      iconColor: 'text-purple-400',
      description: 'Simulates a botnet cycling through 4 distinct IPs (10.200.1.1–4) sharing the same client fingerprint.',
      signals: 'IP Rotation (≥3 IPs -> SUSPICIOUS)',
      requests: '60 requests',
    },
    {
      id: 'TOKEN_REUSE' as AttackPresetType,
      title: '4. Token Hijacking / Stuffing',
      badge: 'TOKEN REUSE (+20)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: KeyRound,
      iconColor: 'text-rose-400',
      description: 'Dispatches identical Bearer session tokens simultaneously across 3 external distributed IPs.',
      signals: 'Token Reuse (≥2 IPs -> SUSPICIOUS)',
      requests: '36 requests',
    },
    {
      id: 'COMBINED_STORM' as AttackPresetType,
      title: '5. Combined Multi-Vector Storm',
      badge: 'HIGH / THROTTLE (429)',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold',
      icon: Flame,
      iconColor: 'text-rose-500',
      description: 'Executes the full combined attack suite (Burst + IP Rotation + Token Reuse) triggering automatic Sentinel throttling.',
      signals: 'Burst (30) + IP Rotation (25) + Token Reuse (20) = 75 (THROTTLE)',
      requests: '120 requests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="p-5 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Attack Simulation & Adversary Emulation Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an attack vector below to inject synthetic threat traffic into Sentinel Gate in real-time.
            </p>
          </div>

          {isRunning && (
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                Attacking: {progress.current} / {progress.total}
              </div>
              <button
                onClick={stopSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold shadow-lg shadow-rose-600/30 transition"
              >
                <Square className="w-3.5 h-3.5" />
                Abort Attack
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && progress.total > 0 && (
          <div className="mt-4">
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 transition-all duration-150"
                style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isThisRunning = isRunning && activePreset === preset.id;

          return (
            <div
              key={preset.id}
              className={`p-4 rounded-xl bg-[#0f1626] border transition flex flex-col justify-between ${
                isThisRunning
                  ? 'border-cyan-500 glow-cyan ring-1 ring-cyan-500'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${preset.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white">{preset.title}</h3>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {preset.description}
                </p>

                <div className="mt-3 p-2 rounded bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-slate-400">
                    <span className="text-slate-500">Expected Signals: </span>
                    <span className="text-slate-200">{preset.signals}</span>
                  </div>
                  <div className="text-slate-400">
                    <span className="text-slate-500">Volume: </span>
                    <span className="text-cyan-400">{preset.requests}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => startSimulation(preset.id)}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40 ${
                    preset.id === 'COMBINED_STORM'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  {isThisRunning ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Executing Vector...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Launch Test Scenario
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Execution Terminal Output */}
      <div className="p-4 rounded-xl bg-[#0a0e17] border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200">
              Live Attack Telemetry Feed ({logs.length} responses captured)
            </h3>
          </div>
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-[11px] font-mono text-slate-400 hover:text-white transition"
            >
              Clear Log
            </button>
          )}
        </div>

        <div
          ref={logContainerRef}
          className="h-64 overflow-y-auto space-y-1.5 font-mono text-xs pr-1"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
              <Terminal className="w-8 h-8 opacity-40 text-slate-600" />
              <p>No simulation activity yet. Select an attack scenario above to launch test traffic.</p>
            </div>
          ) : (
            logs.map((log, index) => {
              const isBlocked = log.status === 403;
              const isThrottled = log.status === 429;
              const isSuccess = log.status === 200;

              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg border flex items-center justify-between transition ${
                    isBlocked
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                      : isThrottled
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 w-8 text-right">#{log.request}</span>
                    <span className="font-semibold text-slate-200">{log.ip}</span>
                    <span className="text-slate-400 text-[11px]">{log.durationMs}ms</span>
                    {log.riskScore !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                        Risk: {log.riskScore} ({log.riskLevel})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isSuccess && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                      </span>
                    )}
                    {isThrottled && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> 429 THROTTLED
                      </span>
                    )}
                    {isBlocked && (
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <XCircle className="w-3.5 h-3.5" /> 403 BLOCKED
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
