import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TrafficChart } from './components/TrafficChart';
import { DetectionEngineView } from './components/DetectionEngineView';
import { AttackSimulatorStudio } from './components/AttackSimulatorStudio';
import { LiveAuditLog } from './components/LiveAuditLog';
import { EndpointTester } from './components/EndpointTester';
import { fetchHealth, fetchTelemetry, fetchEvents, resetSystemState } from './services/api';
import { SentinelTelemetry, SystemHealth, SecurityAuditEntry } from './types/sentinel';

export function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'tester' | 'engine' | 'audit'>('overview');
  const [health, setHealth] = useState<SystemHealth>({
    gateway: 'offline',
    redis: 'offline',
    demoApi: 'offline',
    timestamp: new Date().toISOString(),
  });
  const [telemetry, setTelemetry] = useState<SentinelTelemetry | null>(null);
  const [events, setEvents] = useState<SecurityAuditEntry[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [h, t, ev] = await Promise.all([
        fetchHealth(),
        fetchTelemetry(),
        fetchEvents(undefined, 60),
      ]);
      setHealth(h);
      if (t) setTelemetry(t);
      if (ev) {
        setEvents(ev.events);
        setTotalEvents(ev.total);
      }
    } catch (err) {
      console.error('Failed to load telemetry data:', err);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to flush all Sentinel Gate Redis threat caches and reset audit logs?')) {
      setIsResetting(true);
      await resetSystemState();
      await loadData();
      setIsResetting(false);
    }
  };

  // Periodic Telemetry Auto-Polling (every 1.5 seconds)
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1500);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans cyber-grid selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        health={health}
        telemetry={telemetry}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        onReset={handleReset}
        isResetting={isResetting}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <MetricCards telemetry={telemetry} />
            <TrafficChart telemetry={telemetry} events={events} />

            {/* Quick Action Simulator Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Test Sentinel Gate Detection Live
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Launch multi-vector attack simulations (Rate bursts, IP rotation botnets, token reuse) to test real-time mitigations.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition shadow-lg shadow-rose-950/60 whitespace-nowrap"
              >
                Open Attack Studio →
              </button>
            </div>

            <LiveAuditLog events={events.slice(0, 15)} totalEvents={totalEvents} />
          </div>
        )}

        {/* Tab 2: Attack Simulator Studio */}
        {activeTab === 'simulator' && (
          <AttackSimulatorStudio onSimulationCompleted={loadData} />
        )}

        {/* Tab 3: Detection Engine & Rules */}
        {activeTab === 'engine' && (
          <DetectionEngineView telemetry={telemetry} />
        )}

        {/* Tab 4: API Gateway Proxy Tester */}
        {activeTab === 'tester' && (
          <EndpointTester />
        )}

        {/* Tab 5: Live Audit Log Feed */}
        {activeTab === 'audit' && (
          <LiveAuditLog events={events} totalEvents={totalEvents} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d131f] py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sentinel Gate Security Gateway & Threat Intelligence Engine</span>
          <span className="text-slate-400">Gateway: <span className="text-cyan-400">:3000</span> | Demo API: <span className="text-purple-400">:4000</span> | Dashboard: <span className="text-emerald-400">:5173</span></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
