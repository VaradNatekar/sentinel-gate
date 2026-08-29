import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { SentinelTelemetry } from '../types/sentinel';
import { setSystemMode } from '../services/api';

interface ThreatAlertManagerProps {
  telemetry: SentinelTelemetry | null;
  onRefresh: () => void;
}

export const ThreatAlertManager: React.FC<ThreatAlertManagerProps> = ({ telemetry, onRefresh }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!telemetry) return;

    const isObserveMode = telemetry.systemMode === 'OBSERVE';
    const hasHighRisk = telemetry.peakRisk > 60 || telemetry.riskDistribution.HIGH > 0 || telemetry.riskDistribution.CRITICAL > 0;

    if (isObserveMode && hasHighRisk && !isDismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [telemetry, isDismissed]);

  // Reset dismissal if the system goes back to normal, so it can alert again later
  useEffect(() => {
    if (telemetry && telemetry.peakRisk <= 30 && telemetry.systemMode === 'OBSERVE') {
      setIsDismissed(false);
    }
  }, [telemetry]);

  if (!isVisible) return null;

  const handleMitigate = async () => {
    await setSystemMode('AUTO');
    onRefresh();
  };

  return (
    <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="w-[400px] bg-slate-900/95 backdrop-blur-xl border-l-4 border-l-rose-500 border-y border-r border-slate-800 rounded-lg shadow-[0_8px_32px_rgba(225,29,72,0.2)] overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2 bg-rose-500/20 rounded-full shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-400 tracking-wide uppercase flex items-center gap-2">
                Action Required
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Sentinel Gate is in <strong className="text-amber-400">OBSERVE</strong> mode. 
                High-risk threats have been detected and are currently reaching your backend servers.
              </p>
              
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleMitigate}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold text-xs transition shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:shadow-[0_0_16px_rgba(6,182,212,0.6)]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Enable Intelligent Mitigation
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsDismissed(true)}
              className="text-slate-500 hover:text-slate-300 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Animated Progress Bar at bottom to show urgency */}
        <div className="h-1 w-full bg-slate-800">
          <div className="h-full bg-rose-500 animate-[pulse_1s_ease-in-out_infinite] w-full"></div>
        </div>
      </div>
    </div>
  );
};
