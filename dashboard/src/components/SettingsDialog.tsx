import React, { useState, useEffect } from 'react';
import { Settings, X, Bell, Shield, Database, Activity, Check, Monitor, Zap } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  showShortcuts: boolean;
  setShowShortcuts: (val: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  isOpen, onClose, showShortcuts, setShowShortcuts 
}) => {
  const [theme, setTheme] = useState(localStorage.getItem('sentinel-theme') || 'midnight');
  const [refreshRate, setRefreshRate] = useState('1.5s');

  useEffect(() => {
    // Apply theme to document body
    document.documentElement.className = theme;
    localStorage.setItem('sentinel-theme', theme);
  }, [theme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-[#080b11] text-slate-200 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-[#0f1626] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
            <Settings className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xl">Platform Settings</h3>
            <p className="text-sm text-slate-400 mt-1">Configure your Sentinel Gate workspace</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Body - Full Screen Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Section: Display & UI */}
          <section className="space-y-5">
            <h4 className="flex items-center gap-3 text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-3">
              <Monitor className="w-5 h-5 text-cyan-400" /> Display & UI
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => setTheme('midnight')} className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition ${theme === 'midnight' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                <span className="font-bold text-base mb-1">Midnight Blue</span>
                <span className="text-xs opacity-70">Default Dark Mode</span>
              </button>
              <button onClick={() => setTheme('hacker')} className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition ${theme === 'hacker' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                <span className="font-bold text-base mb-1">Hacker Terminal</span>
                <span className="text-xs opacity-70">High Contrast Green</span>
              </button>
              <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition ${theme === 'light' ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-md' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                <span className="font-bold text-base mb-1">Light Mode</span>
                <span className="text-xs opacity-70">Not Recommended</span>
              </button>
            </div>
          </section>

          {/* Section: Workflow & Shortcuts */}
          <section className="space-y-5">
            <h4 className="flex items-center gap-3 text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-amber-400" /> Workflow & Shortcuts
            </h4>
            
            <label className="flex items-center justify-between p-5 bg-slate-900/30 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/50 transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="font-bold text-slate-200">Show Quick Action Shortcuts in Header</div>
                  <div className="text-sm text-slate-400 mt-1">Displays 6 attack simulator shortcut icons in the top bar for parallel testing from the Overview tab.</div>
                </div>
              </div>
              <div className={`relative inline-block w-12 h-7 rounded-full border-2 transition-colors ${showShortcuts ? 'bg-amber-500 border-amber-900' : 'bg-slate-700 border-slate-800'}`} onClick={() => setShowShortcuts(!showShortcuts)}>
                <div className={`absolute top-0.5 bg-white w-5 h-5 rounded-full transition-transform ${showShortcuts ? 'right-0.5' : 'left-0.5 bg-slate-400'}`}></div>
              </div>
            </label>
          </section>

          {/* Section: Telemetry */}
          <section className="space-y-5">
            <h4 className="flex items-center gap-3 text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-rose-400" /> Telemetry & Polling
            </h4>
            
            <div className="flex items-center justify-between p-5 bg-slate-900/30 rounded-xl border border-slate-800">
              <div>
                <div className="font-bold text-slate-200">Auto-Refresh Interval</div>
                <div className="text-sm text-slate-400 mt-1">How often the dashboard polls Redis for new traffic.</div>
              </div>
              <div className="flex bg-slate-950 rounded-lg border border-slate-700 p-1.5 gap-1">
                {['1.0s', '1.5s', '3.0s'].map(rate => (
                  <button key={rate} onClick={() => setRefreshRate(rate)} className={`px-4 py-2 text-sm font-bold rounded-md transition ${refreshRate === rate ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}>
                    {rate}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
      
      {/* Footer */}
      <div className="p-6 bg-[#0f1626] border-t border-slate-800 flex items-center justify-between">
        <div className="text-sm font-mono text-slate-500 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Settings applied in real-time
        </div>
        <button onClick={onClose} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/30 text-base">
          <Check className="w-5 h-5" />
          Return to Dashboard
        </button>
      </div>

    </div>
  );
};
