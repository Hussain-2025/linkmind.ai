import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { analyticsAPI } from "../services/api.js";
import { useSocket } from "../hooks/useSocket.js";
import { DashboardData } from "../types.js";
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
} from "recharts";
import {
  Link2,
  Activity,
  UserCheck,
  Globe,
  Smartphone,
  MousePointer,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Radio,
  Clock,
} from "lucide-react";

// Theme Palette
const COLORS = ["#6366f1", "#a855f7", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const { activeVisitors, subscribeToGlobalClicks } = useSocket();
  const [recentLiveClick, setRecentLiveClick] = useState<any>(null);

  // Load Dashboard Payload
  const loadDashboard = async () => {
    try {
      const payload = await analyticsAPI.getDashboard();
      setData(payload);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg("Failed to gather global workspace metrics.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Set up real-time listener for any clicks matching user's account links
  useEffect(() => {
    const unsubscribe = subscribeToGlobalClicks((event) => {
      // Prompt live Toast notification
      setRecentLiveClick(event.click);
      setTimeout(() => setRecentLiveClick(null), 4000);

      // Dynamically increment counters
      setData((prev) => {
        if (!prev) return null;
        
        let updatedTimeline = [...prev.clickTimeline];
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Find if today already has a record in timeline
        const todayIdx = updatedTimeline.findIndex((t) => t._id === todayStr);
        if (todayIdx !== -1) {
          updatedTimeline[todayIdx] = {
            ...updatedTimeline[todayIdx],
            clicks: updatedTimeline[todayIdx].clicks + 1,
            unique: updatedTimeline[todayIdx].unique + (event.click.isUnique ? 1 : 0),
          };
        } else {
          updatedTimeline.push({
            _id: todayStr || "",
            clicks: 1,
            unique: event.click.isUnique ? 1 : 0,
          });
        }

        return {
          ...prev,
          totals: {
            ...prev.totals,
            totalClicks: prev.totals.totalClicks + 1,
            uniqueClicks: prev.totals.uniqueClicks + (event.click.isUnique ? 1 : 0),
          },
          clickTimeline: updatedTimeline,
        };
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToGlobalClicks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-slate-200 flex flex-col justify-between">
        <Navbar activeVisitorCount={activeVisitors} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-slate-400 font-mono tracking-wider">AGGREGATING PLATFORM METRICS...</p>
          </div>
        </main>
      </div>
    );
  }

  // Handle zero-links state
  const totalLinks = data?.totals?.totalLinks || 0;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col">
      <Navbar activeVisitorCount={activeVisitors} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Live Click Toast popup */}
        {recentLiveClick && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 rounded-xl border border-indigo-500/20 bg-indigo-950/90 px-4 py-3 text-sm text-indigo-300 shadow-2xl backdrop-blur-md animate-bounce">
            <Radio className="h-5 w-5 text-indigo-400 animate-pulse" />
            <div>
              <p className="font-semibold text-white">Live Click Registered!</p>
              <p className="text-xs text-indigo-300">
                IP: <span className="font-mono">{recentLiveClick.ip}</span> • Region: {recentLiveClick.city}, {recentLiveClick.country}
              </p>
            </div>
          </div>
        )}

        {/* Workspace Title & Actions */}
        <div className="md:flex md:items-center md:justify-between mb-8 border-b border-white/5 pb-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:truncate">
              Platform Headquarters
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Overviewing your LinkMind short codes performance, user trajectories, and real-time activity pipelines.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <RouterLink
              to="/links"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition cursor-pointer"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Shorten New URL
            </RouterLink>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Zero state container */}
        {totalLinks === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-12 text-center shadow-lg relative overflow-hidden backdrop-blur-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6">
              <Link2 className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Configure Your First Link</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Welcome! Start your LinkMind AI journey. Shorten any destination URL with high-speed redirection, tracking analytics, and automated QR vectors.
            </p>
            <RouterLink
              to="/links"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition cursor-pointer"
            >
              Create Short Link
            </RouterLink>
          </div>
        ) : (
          <>
            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              
              {/* Card 1: Total Links */}
              <div className="glass-panel rounded-xl p-6 shadow-md relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Short Codes</p>
                  <p className="text-3xl font-extrabold text-white font-display">
                    {data?.totals?.totalLinks}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Link2 className="h-6 w-6" />
                </div>
              </div>

              {/* Card 2: Total Clicks */}
              <div className="glass-panel rounded-xl p-6 shadow-md relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative Clicks</p>
                  <p className="text-3xl font-extrabold text-white font-display flex items-baseline">
                    {data?.totals?.totalClicks}
                    <span className="ml-1.5 text-xs text-indigo-400 font-mono flex items-center space-x-0.5">
                      <TrendingUp className="h-3 w-3" />
                      <span>Live</span>
                    </span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <MousePointer className="h-6 w-6" />
                </div>
              </div>

              {/* Card 3: Unique Clicks */}
              <div className="glass-panel rounded-xl p-6 shadow-md relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unique Visitors</p>
                  <p className="text-3xl font-extrabold text-white font-display">
                    {data?.totals?.uniqueClicks}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <UserCheck className="h-6 w-6" />
                </div>
              </div>

            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* Area Chart: Clicks timeline */}
              <div className="glass-panel rounded-xl p-6 shadow-md lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>Click Velocity Timeline</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Measuring daily click velocity and visitor unique curves.</p>
                  </div>
                </div>

                <div className="h-72 w-full pr-4">
                  {data && data.clickTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.clickTimeline}>
                        <defs>
                          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorUniques" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="_id"
                          stroke="#475569"
                          fontSize={11}
                          fontFamily="monospace"
                          tickLine={false}
                        />
                        <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            fontFamily: "sans-serif",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorClicks)"
                          name="Total Clicks"
                        />
                        <Area
                          type="monotone"
                          dataKey="unique"
                          stroke="#a855f7"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorUniques)"
                          name="Unique Visitors"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      AWAITING SYSTEM CLICKS TIMELINE...
                    </div>
                  )}
                </div>
              </div>

              {/* Geographic Distributions Card */}
              <div className="glass-panel rounded-xl p-6 shadow-md flex flex-col">
                <h3 className="text-base font-bold text-white flex items-center space-x-1.5 mb-6">
                  <Globe className="h-4 w-4 text-indigo-400" />
                  <span>Geographic Densities</span>
                </h3>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {data && data.countryStats.length > 0 ? (
                    (() => {
                      const maxCount = Math.max(...data.countryStats.map((c) => c.count));
                      return data.countryStats.map((item, idx) => {
                        const percent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        return (
                          <div key={item._id} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-300">{item._id}</span>
                              <span className="font-mono text-indigo-400">{item.count} click{item.count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${percent}%` }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      NO COUNTRY DATA REGISTERED YET.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Secondary Visual Ecosystem Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* Tech Ecosystem Pie Chart: Devices */}
              <div className="glass-panel rounded-xl p-6 shadow-md flex flex-col justify-between">
                <h4 className="text-sm font-bold text-white flex items-center space-x-1.5 mb-4 border-b border-white/5 pb-3">
                  <Smartphone className="h-4 w-4 text-indigo-400" />
                  <span>Ecosystem Device Classes</span>
                </h4>
                
                <div className="h-56 relative flex items-center justify-center">
                  {data && data.deviceStats.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.deviceStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="count"
                            nameKey="_id"
                          >
                            {data.deviceStats.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Sub Legend text inside donut hole */}
                      <div className="absolute text-center">
                        <span className="block text-xl font-extrabold text-white font-display">
                          {data.totals.totalClicks}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold block">
                          Clicks total
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 font-mono">NO DATA</div>
                  )}
                </div>

                {/* Donut Legend */}
                {data && data.deviceStats.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
                    {data.deviceStats.slice(0, 3).map((item, idx) => (
                      <div key={item._id} className="flex items-center space-x-1 justify-center border border-white/5 rounded py-1">
                        <div
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          className="h-2 w-2 rounded-full"
                        />
                        <span className="text-slate-400 capitalize truncate max-w-[50px]">{item._id}</span>
                        <span className="text-white">({item.count})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Referrer list details */}
              <div className="glass-panel rounded-xl p-6 shadow-md flex flex-col">
                <h4 className="text-sm font-bold text-white flex items-center space-x-1.5 mb-4 border-b border-white/5 pb-3">
                  <ExternalLink className="h-4 w-4 text-indigo-400" />
                  <span>Traffic Inbound Gateways</span>
                </h4>
                
                <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                  {data && data.referrerStats.length > 0 ? (
                    data.referrerStats.slice(0, 5).map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 truncate max-w-[150px] font-mono">
                          {item._id === "Direct" ? "Direct URL Entry" : item._id}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-950 border border-white/5 text-slate-400 font-mono">
                          {item.count} clicks
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      AWAITING CAMPAIGN REDIRECTS...
                    </div>
                  )}
                </div>
              </div>

              {/* Browser Split */}
              <div className="glass-panel rounded-xl p-6 shadow-md flex flex-col">
                <h4 className="text-sm font-bold text-white flex items-center space-x-1.5 mb-4 border-b border-white/5 pb-3">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  <span>Visitor Agent Browsers</span>
                </h4>

                <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                  {data && data.browserStats.length > 0 ? (
                    data.browserStats.slice(0, 5).map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 font-mono">{item._id}</span>
                        <span className="text-xs font-semibold text-indigo-400 font-mono">
                          {((item.count / data.totals.totalClicks) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                      NO DATA
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Top performing workspace shortened URLs */}
            <div className="glass-panel rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-base font-bold text-white">Top Performing Endpoints</h4>
                  <p className="text-xs text-slate-400 mt-1">Short codes capturing the highest user volumes.</p>
                </div>
                <RouterLink
                  to="/links"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
                >
                  <span>Manage all links</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </RouterLink>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-400 uppercase tracking-wider font-mono">
                      <th className="py-3 pl-2">Short Code / Alias</th>
                      <th className="py-3 hidden md:table-cell">Target Destination</th>
                      <th className="py-3 text-right">Clicks Register</th>
                      <th className="py-3 text-right pr-2">Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {data && data.topLinks.map((link) => (
                      <tr key={link._id} className="hover:bg-white/[0.01] transition">
                        <td className="py-4 pl-2">
                          <RouterLink
                            to={`/links`}
                            className="font-mono font-bold text-indigo-400 hover:underline"
                          >
                            /{link.shortCode}
                          </RouterLink>
                        </td>
                        <td className="py-4 hidden md:table-cell max-w-[280px] truncate text-slate-400">
                          {link.originalUrl}
                        </td>
                        <td className="py-4 text-right font-mono font-semibold text-white">
                          {link.clicks || 0}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <RouterLink
                            to={`/links`}
                            className="inline-flex items-center rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
                          >
                            <span>Details</span>
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </RouterLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
