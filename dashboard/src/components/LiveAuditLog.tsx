import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Clock, FileCode } from 'lucide-react';
import { SecurityAuditEntry, RiskLevel } from '../types/sentinel';

interface LiveAuditLogProps {
  events: SecurityAuditEntry[];
  totalEvents?: number;
}

export const LiveAuditLog: React.FC<LiveAuditLogProps> = ({ events, totalEvents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = React.useMemo(() => {
    return events.filter((entry) => {
      const matchesLevel = selectedLevel === 'ALL' || entry.risk.level === selectedLevel;
      const matchesSearch =
        searchTerm === '' ||
        entry.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.token && entry.token.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.method.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesLevel && matchesSearch;
    });
  }, [events, selectedLevel, searchTerm]);

  const getStatusBadge = (status: number) => {
    if (status === 200) {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-bold">
          200 OK
        </span>
      );
    }
    if (status === 429) {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[11px] font-bold">
          429 THROTTLED
        </span>
      );
    }
    if (status === 403) {
      return (
        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono text-[11px] font-bold">
          403 BLOCKED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
        {status}
      </span>
    );
  };

  const getRiskBadge = (level: RiskLevel, score: number) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500 font-mono text-[11px] font-bold">
            {score} CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500 font-mono text-[11px] font-bold">
            {score} HIGH
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500 font-mono text-[11px] font-bold">
            {score} SUSPICIOUS
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
            {score} NORMAL
          </span>
        );
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Live Security Audit & Event Log
            {totalEvents !== undefined && totalEvents > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {totalEvents} events
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit stream of all requests inspected and policy decisions enacted by Sentinel Gate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search IP, endpoint, token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition w-56 font-mono"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {['ALL', 'NORMAL', 'SUSPICIOUS', 'HIGH', 'CRITICAL'].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-2.5 py-1 rounded transition text-[11px] font-semibold ${
                  selectedLevel === level
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Method & Path</th>
              <th className="py-2.5 px-3">Client IP</th>
              <th className="py-2.5 px-3">Signals Detected</th>
              <th className="py-2.5 px-3">Risk Evaluation</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No security events found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const activeSignals = entry.risk.signals.filter((s) => s.detected);

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className={`hover:bg-slate-900/60 cursor-pointer transition ${
                        isExpanded ? 'bg-slate-900/80' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        <span className="text-cyan-400 mr-1.5">{entry.method}</span>
                        {entry.path}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-semibold">{entry.ip}</td>
                      <td className="py-2.5 px-3">
                        {activeSignals.length === 0 ? (
                          <span className="text-slate-600 text-[10px]">None (Clean)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activeSignals.map((s) => (
                              <span
                                key={s.name}
                                className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[10px]"
                              >
                                {s.name} (+{s.score})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">{getRiskBadge(entry.risk.level, entry.risk.score)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200 flex items-center gap-2 mt-1">
                        {entry.risk.action}
                        {entry.wasObserved && (
                          <span className="text-[9px] text-amber-400 font-normal border border-amber-500/30 bg-amber-500/10 px-1 py-0.5 rounded">
                            OBSERVED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">{getStatusBadge(entry.status)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                      </td>
                    </tr>

                    {/* Expandable JSON Detail View */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-slate-800">
                        <td colSpan={8} className="p-4">
                          <div className="p-3 rounded-lg bg-[#080b11] border border-slate-800 text-xs font-mono space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                                <FileCode className="w-4 h-4" /> Full Security Audit Payload - {entry.id}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                Response Time: {entry.durationMs || 0}ms
                              </span>
                            </div>
                            <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 rounded bg-slate-950">
                              {JSON.stringify(entry, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
