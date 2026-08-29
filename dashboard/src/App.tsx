import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TrafficChart } from './components/TrafficChart';
import { DetectionEngineView } from './components/DetectionEngineView';
import { AttackSimulatorStudio } from './components/AttackSimulatorStudio';
import { LiveAuditLog } from './components/LiveAuditLog';
import { EndpointTester } from './components/EndpointTester';
import { fetchHealth, fetchTelemetry, fetchEvents, resetSystemState, setSystemMode } from './services/api';
import { SentinelTelemetry, SystemHealth, SecurityAuditEntry } from './types/sentinel';
import { ShieldCheck } from 'lucide-react';
import { ThreatAlertManager } from './components/ThreatAlertManager';
import { PlatformDialog } from './components/PlatformDialog';
import { SettingsDialog } from './components/SettingsDialog';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });

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
    setIsResetting(true);
    await resetSystemState();
    await loadData();
    setIsResetting(false);
  };

  const handleCustomModeClick = () => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title: 'Enterprise License Required',
      message: 'CUSTOM mode requires an Enterprise License. Please contact your account representative to configure granular tactical rules.'
    });
  };

  // Periodic Telemetry Auto-Polling (every 1.5 seconds)
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1500);
    return () => clearInterval(interval);
  }, [loadData]);

  // Only show the screen red vignette if the system is vulnerable (OBSERVE mode)
  const isCritical = (telemetry?.peakRisk ?? 0) > 80 && telemetry?.systemMode === 'OBSERVE';

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans cyber-grid selection:bg-cyan-500 selection:text-black relative">
      
      {/* Full-Screen Critical Threat Flicker */}
      {isCritical && (
        <div className="pointer-events-none fixed inset-0 z-[9999] bg-rose-900/15 shadow-[inset_0_0_250px_rgba(225,29,72,0.3)] animate-[pulse_1.5s_ease-in-out_infinite] mix-blend-screen transition-opacity duration-1000"></div>
      )}
      
      {/* Actionable Threat Alert Manager */}
      <ThreatAlertManager telemetry={telemetry} onRefresh={handleManualRefresh} />

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
        onCustomClick={handleCustomModeClick}
        onSettingsClick={() => setIsSettingsOpen(true)}
        showShortcuts={showShortcuts}
      />
      
      {/* Global Platform Dialog */}
      <PlatformDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />
      
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 space-y-6">
        
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
    </div>
  );
}

export default App;
