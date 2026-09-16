import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { linksAPI } from "../services/api.js";
import { useSocket } from "../hooks/useSocket.js";
import { LinkStatsResult } from "../types.js";
import Navbar from "../components/Navbar.js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  Calendar,
  Lock,
  MousePointer,
  PieChart as PieIcon,
  Sparkles,
  RefreshCw,
  Globe,
  Monitor,
  CalendarDays,
  ExternalLink,
  Info,
} from "lucide-react";

const COLORS = ["#6366f1", "#a855f7", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"];

export default function LinkDetails() {
  const { id } = useParams<{ id: string }>();
  
  const [stats, setStats] = useState<LinkStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // AI states
  const [aiInsights, setAiInsights] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiStep, setAiStep] = useState("");

  const { activeVisitors, subscribeToLink } = useSocket();

  const loadStats = async () => {
    if (!id) return;
    try {
      const data = await linksAPI.getStats(id);
      setStats(data);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg("Failed to gather analytics telemetry data for this link.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [id]);

  // Subscribe to real-time additions for this specific link
  useEffect(() => {
    if (!id || !stats) return;

    const unsubscribe = subscribeToLink(id, (event) => {
      // Dynamic increment metrics
      setStats((prev) => {
        if (!prev) return null;
        
        let updatedTimeline = [...prev.metrics.clickTimeline];
        const dateStr = new Date().toISOString().split("T")[0];
        
        // Find if date exists
        const dateIdx = updatedTimeline.findIndex((t) => t._id === dateStr);
        if (dateIdx !== -1) {
          updatedTimeline[dateIdx] = {
            ...updatedTimeline[dateIdx],
            clicks: updatedTimeline[dateIdx].clicks + 1,
            unique: updatedTimeline[dateIdx].unique + (event.click.isUnique ? 1 : 0),
          };
        } else {
          updatedTimeline.push({
            _id: dateStr || "",
            clicks: 1,
            unique: event.click.isUnique ? 1 : 0,
          });
        }

        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            totalClicks: prev.metrics.totalClicks + 1,
            uniqueClicks: prev.metrics.uniqueClicks + (event.click.isUnique ? 1 : 0),
            clickTimeline: updatedTimeline,
          },
        };
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id, stats, subscribeToLink]);

  // Handle Triggering the gemini-3.5-flash AI marketing insights
  const handleQueryAI = async () => {
    if (!id) return;
    setLoadingAI(true);
    setAiInsights("");

    const stages = [
      "Securing analytical telemetry...",
      "Analyzing country distribution indexes...",
      "Correlating device user agents...",
      "Synthesizing hourly peak density recommendations...",
      "Drafting marketing optimization guidelines...",
    ];

    let sc = 0;
    setAiStep(stages[0]);
    const intervalRef = setInterval(() => {
      sc++;
      if (sc < stages.length) {
        setAiStep(stages[sc]);
      }
    }, 1800);

    try {
      const res = await linksAPI.getAIInsights(id);
      setAiInsights(res.insights);
    } catch (err: any) {
      console.error(err);
      setAiInsights("Failed to finalize AI strategy extraction.");
    } finally {
      clearInterval(intervalRef);
      setLoadingAI(false);
      setAiStep("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-slate-200 flex flex-col justify-between">
        <Navbar activeVisitorCount={activeVisitors} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-400 font-mono">AGGREGATING TELETRAFFIC MATRICS...</p>
          </div>
        </main>
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="min-h-screen bg-transparent text-slate-200 flex flex-col">
        <Navbar activeVisitorCount={activeVisitors} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-5 text-sm text-red-300">
            {errorMsg || "Requested link telemetry could not be located."}
          </div>
        </main>
      </div>
    );
  }

  const { link, metrics } = stats;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col">
      <Navbar activeVisitorCount={activeVisitors} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Back and Breadcrumb */}
        <div className="mb-6">
          <RouterLink
            to="/links"
            className="inline-flex items-center space-x-1 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Links Library</span>
          </RouterLink>
        </div>

        {/* Link Heading summary */}
        <div className="glass-panel rounded-2xl p-6 mb-8 border-white/5 bg-slate-900/45">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-black text-white">
                  /{link.shortCode}
                </h2>
                {link.isOneTime && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    One-Time Burn on redirection
                  </span>
                )}
                {link.password && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-pink-500/11 text-pink-400 border border-pink-500/20">
                    Locked
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-400 max-w-3xl truncate" title={link.originalUrl}>
                Target: <span className="text-slate-300 hover:underline font-mono">{link.originalUrl}</span>
              </p>
            </div>

            <div className="mt-4 md:mt-0 md:ml-6 flex items-center space-x-3 shrink-0">
              <button
                onClick={loadStats}
                className="inline-flex items-center space-x-1.5 rounded-lg border border-white/5 bg-slate-950 px-3.5 py-2 text-xs font-semibold hover:bg-slate-900 transition cursor-pointer"
                title="Refresh stats"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Telemetry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Charts diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Timeline chart */}
          <div className="glass-panel rounded-xl p-6 lg:col-span-3">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center space-x-1.5 font-display uppercase tracking-wider">
              <CalendarDays className="h-4 w-4 text-indigo-400" />
              <span>Trend Timeline Velocity</span>
            </h3>

            <div className="h-64 pr-2">
              {metrics.clickTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.clickTimeline}>
                    <defs>
                      <linearGradient id="gradientClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="_id"
                      stroke="#475569"
                      fontSize={10}
                      fontFamily="monospace"
                      tickLine={false}
                    />
                    <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1324",
                        borderColor: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gradientClicks)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  AWAITING TRAFFIC VELOCITY EVENT STREAMS...
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-rows-2 gap-4 lg:col-span-1">
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-1">Click volume</span>
              <span className="text-4xl font-extrabold font-display">{metrics.totalClicks}</span>
              <span className="text-[10px] text-slate-500 mt-1 uppercase">Cumulative click counters</span>
            </div>
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest block mb-1">Unique visitors</span>
              <span className="text-4xl font-extrabold font-display">{metrics.uniqueClicks}</span>
              <span className="text-[10px] text-slate-500 mt-1 uppercase">Distinct user IP indices</span>
            </div>
          </div>

        </div>

        {/* Double charts split row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Countries progress bar ratios */}
          <div className="glass-panel rounded-xl p-6">
            <h4 className="text-xs font-bold font-display uppercase tracking-widest mb-6 block border-b border-white/5 pb-3 flex items-center space-x-1.5">
              <Globe className="h-3.5 w-3.5 text-indigo-400" />
              <span>Core Traffic Regions</span>
            </h4>

            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {metrics.countryStats.length > 0 ? (
                (() => {
                  const max = Math.max(...metrics.countryStats.map((c) => c.count));
                  return metrics.countryStats.map((item) => (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">{item._id}</span>
                        <span className="text-slate-400 font-mono">({item.count} click{item.count !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="h-1 bg-slate-950 w-full rounded-full">
                        <div
                          style={{ width: `${(item.count / max) * 100}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="text-xs text-slate-500 font-mono text-center pt-8">AWAITING VISITORS...</div>
              )}
            </div>
          </div>

          {/* Device distribution Pie Chart */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
            <h4 className="text-xs font-bold font-display uppercase tracking-widest mb-4 block border-b border-white/5 pb-3 flex items-center space-x-1.5">
              <Monitor className="h-3.5 w-3.5 text-indigo-400" />
              <span>Devices Profiling</span>
            </h4>

            <div className="h-44 relative flex items-center justify-center">
              {metrics.deviceStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.deviceStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={41}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {metrics.deviceStats.map((e, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">NO TELEMETRY RECORDED</span>
              )}
            </div>

            {/* Sub legends */}
            {metrics.deviceStats.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center text-[10px] font-mono mt-2">
                {metrics.deviceStats.map((item, idx) => (
                  <div key={item._id} className="flex items-center space-x-1 capitalize">
                    <div style={{ backgroundColor: COLORS[idx % COLORS.length] }} className="h-2 w-2 rounded-full" />
                    <span className="text-slate-400">{item._id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inbound referrers gateway profiles */}
          <div className="glass-panel rounded-xl p-6 flex flex-col">
            <h4 className="text-xs font-bold font-display uppercase tracking-widest mb-6 block border-b border-white/5 pb-3 flex items-center space-x-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              <span>Inbound referral links</span>
            </h4>

            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {metrics.referrerStats.length > 0 ? (
                metrics.referrerStats.map((item) => (
                  <div key={item._id} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-mono truncate max-w-[140px]">{item._id === "Direct" ? "Direct user entry" : item._id}</span>
                    <span className="font-semibold text-slate-500 font-mono">{item.count} clicks</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 font-mono text-center pt-8">AWAITING VISITORS...</div>
              )}
            </div>
          </div>

        </div>

        {/* Gemini AI Intelligence Console */}
        <div id="ai-intelligence-module" className="rounded-2xl border border-indigo-500/25 bg-gradient-to-tr from-indigo-950/20 via-purple-950/20 to-slate-950 p-6 shadow-xl relative overflow-hidden mb-12">
          
          {/* Sparkles background effect */}
          <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                <span className="font-display">LinkMind AI Intelligence Terminal</span>
              </h3>
              <p className="text-xs text-indigo-300/80">
                Invoke the unified Gemini 3.5 AI Engine to analyze your URL click distribution, hourly curves, and write targeted optimization plays.
              </p>
            </div>
            <button
              id="trigger-ai-btn"
              onClick={handleQueryAI}
              disabled={loadingAI}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer self-start md:self-center"
            >
              {loadingAI ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Invoking Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span>Extract AI Blueprint</span>
                </>
              )}
            </button>
          </div>

          {/* AI Loader status updates */}
          {loadingAI && (
            <div className="rounded-xl border border-indigo-500/10 bg-indigo-950/30 p-8 text-center animate-pulse">
              <Sparkles className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-white">{aiStep || "Requisitioning models telemetry..."}</p>
              <p className="text-[11px] text-indigo-300 mt-1 font-mono uppercase tracking-widest">Correlating datasets on Gemini-3.5-flash</p>
            </div>
          )}

          {/* AI Output markdown box */}
          {aiInsights && !loadingAI && (
            <div className="rounded-xl border border-white/5 bg-slate-950/70 p-6 overflow-hidden max-w-none text-slate-300">
              <div className="flex items-center space-x-1.5 mb-4 border-b border-white/5 pb-2 text-indigo-400 text-xs uppercase tracking-wider font-mono font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Computed Report Outline</span>
              </div>
              
              {/* Output Content */}
              <div className="prose prose-invert prose-xs text-sm font-sans space-y-4 leading-relaxed leading-7">
                {aiInsights.split("\n").map((line, idx) => {
                  if (line.startsWith("###")) {
                    return <h4 key={idx} className="text-base font-bold text-white mt-4">{line.replace("###", "").trim()}</h4>;
                  }
                  if (line.startsWith("##")) {
                    return <h3 key={idx} className="text-lg font-bold tracking-tight text-white mt-6 border-b border-white/5 pb-1">{line.replace("##", "").trim()}</h3>;
                  }
                  if (line.startsWith("#")) {
                    return <h2 key={idx} className="text-xl font-bold tracking-tight text-white mt-8">{line.replace("#", "").trim()}</h2>;
                  }
                  if (line.startsWith("-")) {
                    return (
                      <ul key={idx} className="list-disc pl-5 my-1.5 text-slate-300">
                        <li>{line.replace("-", "").trim()}</li>
                      </ul>
                    );
                  }
                  if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
                    return <p key={idx} className="font-semibold text-indigo-300 mt-4">{line}</p>;
                  }
                  return <p key={idx} className="text-slate-300 min-h-[1.5rem]">{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Empty display */}
          {!aiInsights && !loadingAI && (
            <div className="rounded-xl border border-dashed border-white/5 p-8 text-center text-xs text-slate-500 font-mono uppercase tracking-wider">
              AI ENGINE IDLE. PRESS BUTTON ON TOP TO TRIGGER DISPATCH.
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
