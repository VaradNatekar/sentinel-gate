import React, { useState } from 'react';
import { Send, Terminal, Shield, CheckCircle2, AlertTriangle, XCircle, Code, Layers } from 'lucide-react';
import { sendProxyRequest } from '../services/api';
import { SimulationResult } from '../types/sentinel';

export const EndpointTester: React.FC = () => {
  const [endpoint, setEndpoint] = useState('/api/results');
  const [method, setMethod] = useState('GET');
  const [ip, setIp] = useState('192.168.1.100');
  const [token, setToken] = useState('');
  const [userAgent, setUserAgent] = useState('SentinelTester/1.0');
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<SimulationResult | null>(null);

  const predefinedEndpoints = [
    { path: '/api/results', desc: 'Exam/Score results dataset (GET)' },
    { path: '/api/tickets', desc: 'Support tickets dataset (GET)' },
    { path: '/api/profile', desc: 'User profile metadata (GET)' },
  ];

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const res = await sendProxyRequest(endpoint, {
        method,
        ip: ip.trim() || undefined,
        token: token.trim() || undefined,
        userAgent: userAgent.trim() || undefined,
      });
      setResponseResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Request Configuration Form */}
      <div className="p-5 rounded-xl bg-[#0f1626] border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gateway Proxy Request Studio</h2>
            <p className="text-xs text-slate-400">
              Send test HTTP calls through Sentinel Gate (:3200) and inspect proxy forwarding to Demo API (:4200).
            </p>
          </div>
        </div>

        {/* Quick Endpoint Presets */}
        <div>
          <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1.5 block">
            Quick Endpoints:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {predefinedEndpoints.map((ep) => (
              <button
                key={ep.path}
                type="button"
                onClick={() => setEndpoint(ep.path)}
                className={`p-2 rounded-lg text-left border transition text-xs font-mono ${
                  endpoint === ep.path
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>{ep.path}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{ep.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Method & Endpoint Path */}
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-1">
            <label className="text-[11px] font-mono text-slate-400 font-semibold mb-1 block">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="col-span-3">
            <label className="text-[11px] font-mono text-slate-400 font-semibold mb-1 block">Target Path</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/results"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* IP Spoofing Header */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 font-semibold mb-1 block">
            Client IP (<span className="text-slate-500">X-Forwarded-For</span>)
          </label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g. 192.168.1.100 or 10.0.0.5"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Authorization Bearer Token */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 font-semibold mb-1 block">
            Authorization Token (<span className="text-slate-500">Bearer token</span>)
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="e.g. demo-token or leave empty"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* User Agent */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 font-semibold mb-1 block">
            User Agent Header
          </label>
          <input
            type="text"
            value={userAgent}
            onChange={(e) => setUserAgent(e.target.value)}
            placeholder="Custom User Agent string"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Dispatching Request...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Send Request Through Sentinel Gate
            </>
          )}
        </button>
      </div>

      {/* Right: Response Inspector */}
      <div className="p-5 rounded-xl bg-[#0a0e17] border border-slate-800 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white">Gateway Response & Security Verdict</h3>
            </div>

            {responseResult && (
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">{responseResult.durationMs}ms</span>
                {responseResult.status === 200 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    200 OK
                  </span>
                )}
                {responseResult.status === 429 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                    429 THROTTLED
                  </span>
                )}
                {responseResult.status === 403 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                    403 BLOCKED
                  </span>
                )}
              </div>
            )}
          </div>

          {!responseResult ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 opacity-40 text-slate-600" />
              <p className="text-xs">No response yet. Dispatch a test request using the controls on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Verdict Summary Card */}
              {responseResult.riskScore !== undefined ? (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span className="text-slate-300">Risk Assessment: </span>
                    <span className="font-bold text-rose-400">{responseResult.riskScore}/100</span>
                    <span className="text-slate-500">({responseResult.riskLevel})</span>
                  </div>
                  <div className="text-amber-400 font-bold">ACTION: {responseResult.action}</div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 font-mono text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clean Traffic — Successfully Proxied</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Header: X-Sentinel-Protected</span>
                </div>
              )}

              {/* JSON Data Viewer */}
              <div className="mt-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold mb-1 block">
                  Response Payload:
                </span>
                <pre className="p-3 rounded-lg bg-[#080b11] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-64">
                  {JSON.stringify(responseResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
