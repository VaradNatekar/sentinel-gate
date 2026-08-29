import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, PieChart as PieIcon } from 'lucide-react';
import { SentinelTelemetry, SecurityAuditEntry } from '../types/sentinel';

interface TrafficChartProps {
  telemetry: SentinelTelemetry | null;
  events: SecurityAuditEntry[];
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ telemetry, events }) => {
  // Aggregate recent events into time buckets for the area chart
  const timeSeriesData = React.useMemo(() => {
    if (!events || events.length === 0) {
      // Return placeholder baseline points
      return Array.from({ length: 10 }).map((_, i) => ({
        time: `${i * 5}s`,
        allowed: 0,
        throttled: 0,
        risk: 0,
      }));
    }

    // Group events in chunks of 5 or by timestamp seconds
    const reversed = [...events].reverse();
    const buckets: { time: string; allowed: number; throttled: number; risk: number; count: number }[] = [];
    const chunkSize = Math.max(1, Math.floor(reversed.length / 15));

    for (let i = 0; i < reversed.length; i += chunkSize) {
      const chunk = reversed.slice(i, i + chunkSize);
      const allowedCount = chunk.filter((e) => e.status < 400).length;
      const throttledCount = chunk.filter((e) => e.status >= 400).length;
      const avgScore = Math.round(chunk.reduce((sum, e) => sum + e.risk.score, 0) / chunk.length);
      const lastItem = chunk[chunk.length - 1];
      const timeLabel = new Date(lastItem.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      buckets.push({
        time: timeLabel,
        allowed: allowedCount,
        throttled: throttledCount,
        risk: avgScore,
        count: chunk.length,
      });
    }

    return buckets.slice(-15);
  }, [events]);

  const riskDistributionData = [
    {
      name: 'NORMAL',
      count: telemetry?.riskDistribution.NORMAL || 0,
      color: '#10b981',
      desc: 'Score 0-30 (Allow)',
    },
    {
      name: 'SUSPICIOUS',
      count: telemetry?.riskDistribution.SUSPICIOUS || 0,
      color: '#f59e0b',
      desc: 'Score 31-60 (Monitor)',
    },
    {
      name: 'HIGH',
      count: telemetry?.riskDistribution.HIGH || 0,
      color: '#f97316',
      desc: 'Score 61-80 (Throttle)',
    },
    {
      name: 'CRITICAL',
      count: telemetry?.riskDistribution.CRITICAL || 0,
      color: '#f43f5e',
      desc: 'Score 81-100 (Block)',
    },
  ];

  const totalRiskCount = riskDistributionData.reduce((sum, item) => sum + item.count, 0);
  
  // Fallback to a gray pie if no traffic has been evaluated yet
  const displayPieData = totalRiskCount === 0 
    ? [{ name: 'No Data Yet', count: 1, color: '#1e293b' }] 
    : riskDistributionData.filter(item => item.count > 0); // Only show slices with > 0 for cleaner UI

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Real-time Traffic Timeline */}
      <div className="lg:col-span-2 p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Live Traffic & Mitigation Timeline</h3>
              <p className="text-[11px] text-slate-400">Request throughput vs throttled attack traffic</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300">Allowed Traffic</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Throttled / Blocked</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorThrottled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d131f',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Area
                type="monotone"
                dataKey="allowed"
                name="Allowed Requests"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAllowed)"
              />
              <Area
                type="monotone"
                dataKey="throttled"
                name="Throttled/Blocked"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorThrottled)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Threat Risk Level Distribution */}
      <div className="p-4 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Threat Risk Distribution</h3>
              <p className="text-[11px] text-slate-400">Proportion of requests by severity level</p>
            </div>
          </div>
        </div>

        <div className="h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={displayPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={displayPieData.length <= 1 ? 0 : 4}
                dataKey="count"
                stroke="none"
                cornerRadius={4}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {displayPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'No Data Yet') return ['Awaiting traffic...', 'Status'];
                  return [`${value} Requests`, name];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)', // lighter slate-800 background
                  borderColor: '#475569', // slate-600 border
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
                }}
                itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                labelStyle={{ color: '#cbd5e1', marginBottom: '4px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend pills */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
          {riskDistributionData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300">{item.name}</span>
              </div>
              <span className="font-bold text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
