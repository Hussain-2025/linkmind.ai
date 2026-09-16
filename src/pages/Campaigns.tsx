import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link as RouterLink } from "react-router-dom";
import { campaignsAPI } from "../services/api.js";
import { useSocket } from "../hooks/useSocket.js";
import { Campaign, Link as LinkType } from "../types.js";
import Navbar from "../components/Navbar.js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FolderKanban,
  Sparkles,
  Info,
  Layers,
  Calendar,
  MousePointer,
  ChevronRight,
  TrendingUp,
  Globe,
  Plus,
  Trash2,
  AlertTriangle,
  FolderOpen,
  ArrowLeft,
  Barcode,
} from "lucide-react";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form creation states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creationError, setCreationError] = useState("");
  const [creationSuccess, setCreationSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selected Campaign details (Aggregate drilldown)
  const [activeRefId, setActiveRefId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<any | null>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [campaignDeleteName, setCampaignDeleteName] = useState<string>("");
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [campaignDeleteError, setCampaignDeleteError] = useState<string | null>(null);

  const { activeVisitors } = useSocket();

  const loadCampaigns = async () => {
    setLoadingList(true);
    try {
      const data = await campaignsAPI.getList();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns catalog:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationError("");
    setCreationSuccess("");
    setSubmitting(true);

    try {
      if (!name) {
        throw new Error("Campaign folder title is required.");
      }
      await campaignsAPI.create({ name, description });
      setName("");
      setDescription("");
      setCreationSuccess("Campaign catalog initialized successfully!");
      loadCampaigns();
    } catch (err: any) {
      setCreationError(err.response?.data?.message || err.message || "Failed to finalize campaign creation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCampaign = async (id: string) => {
    setActiveRefId(id);
    setLoadingDrilldown(true);
    setDrilldownData(null);

    try {
      const data = await campaignsAPI.getStats(id);
      setDrilldownData(data);
    } catch (err) {
      console.error("Campaign stats load failed:", err);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    setDeletingCampaign(true);
    setCampaignDeleteError(null);
    try {
      await campaignsAPI.delete(campaignToDelete);
      setActiveRefId(null);
      setDrilldownData(null);
      setCampaignToDelete(null);
      loadCampaigns();
    } catch (err: any) {
      console.error("Purge campaign catalog error:", err);
      setCampaignDeleteError(err.response?.data?.message || err.message || "Failed to delete campaign context");
    } finally {
      setDeletingCampaign(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col">
      <Navbar activeVisitorCount={activeVisitors} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Drilldown Mode Back button */}
        {activeRefId && (
          <div className="mb-6">
            <button
              onClick={() => {
                setActiveRefId(null);
                setDrilldownData(null);
              }}
              className="inline-flex items-center space-x-1.5 py-1 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Campaigns Overview</span>
            </button>
          </div>
        )}

        {/* Heading */}
        <div className="mb-8 font-display">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FolderKanban className="h-6 w-6 text-indigo-400" />
            <span>Campaign Folders Suite</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Group shortened codes into logical nodes to monitor compound performance.
          </p>
        </div>

        {/* Drilldown Active Drilldown Workspace */}
        {activeRefId ? (
          <div className="space-y-8 animate-fadeIn">
            
            {loadingDrilldown ? (
              <div className="py-24 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="text-xs text-slate-400 font-mono mt-4 uppercase tracking-widest">Compiling drilldown metrics...</p>
              </div>
            ) : drilldownData ? (
              <>
                {/* Meta details header drilldown */}
                <div className="glass-panel rounded-2xl p-6 border-white/5 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono">drilldown analysis</span>
                    <h3 className="text-xl font-bold text-white mt-1 capitalize">{drilldownData.campaign.name}</h3>
                    {drilldownData.campaign.description && (
                      <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{drilldownData.campaign.description}&rdquo;</p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setCampaignToDelete(drilldownData.campaign._id);
                        setCampaignDeleteName(drilldownData.campaign.name);
                        setCampaignDeleteError(null);
                      }}
                      className="inline-flex items-center space-x-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Deconstruct Campaign</span>
                    </button>
                  </div>
                </div>

                {/* Performance numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="glass-panel rounded-xl p-6 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-1">Total click registers</span>
                    <span className="text-3xl font-extrabold font-display">{drilldownData.metrics.totalClicks}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-6 text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest block mb-1">Unique active IPs</span>
                    <span className="text-3xl font-extrabold font-display">{drilldownData.metrics.uniqueClicks}</span>
                  </div>
                  <div className="glass-panel rounded-xl p-6 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block mb-1">Shortcodes linked</span>
                    <span className="text-3xl font-extrabold font-display">{drilldownData.links.length}</span>
                  </div>
                </div>

                {/* Sub graphs split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Chart clicks timeline */}
                  <div className="glass-panel rounded-xl p-6 lg:col-span-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-6">aggregated clicks timeline (last 15 days)</h4>
                    <div className="h-64 pr-2">
                      {drilldownData.metrics.clickTimeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={drilldownData.metrics.clickTimeline}>
                            <defs>
                              <linearGradient id="gradCampaign" x1="0" y1="0" x2="0" y2="1">
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
                                backgroundColor: "#0f172a",
                                borderColor: "rgba(255,255,255,0.06)",
                                color: "#fff",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="clicks"
                              stroke="#6366f1"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#gradCampaign)"
                              name="Clicks"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                          AWAITING SUB-CODE CLICKS...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Countries */}
                  <div className="glass-panel rounded-xl p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-6 flex items-center space-x-1.5">
                      <Globe className="h-4 w-4 text-indigo-400" />
                      <span>Traffic Geographies</span>
                    </h4>

                    <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                      {drilldownData.metrics.countryStats.length > 0 ? (
                        (() => {
                          const max = Math.max(...drilldownData.metrics.countryStats.map((c: any) => c.count));
                          return drilldownData.metrics.countryStats.map((item: any) => (
                            <div key={item._id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-300 font-semibold">{item._id}</span>
                                <span className="text-slate-400 font-mono">{item.count} clicks</span>
                              </div>
                              <div className="h-1 bg-slate-950 rounded-full">
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

                </div>

                {/* Sub shortened Links List table list drilldown */}
                <div className="glass-panel rounded-xl p-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono mb-4 border-b border-white/5 pb-2">nested campaigns endpoints</h4>
                  {drilldownData.links.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-400 italic">No links grouped under this directory. Go to My Links to bundle them.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-widest font-mono">
                            <th className="py-2.5 pl-2">Short Code</th>
                            <th className="py-2.5">Long Target URL</th>
                            <th className="py-2.5 text-right pr-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {drilldownData.links.map((ln: LinkType) => (
                            <tr key={ln._id} className="hover:bg-white/[0.01] transition">
                              <td className="py-3 pl-2 font-mono font-bold text-indigo-400">/{ln.shortCode}</td>
                              <td className="py-3 max-w-[340px] truncate text-slate-400 font-mono">{ln.originalUrl}</td>
                              <td className="py-3 text-right pr-2">
                                <RouterLink
                                  to={`/links`}
                                  className="inline-flex items-center space-x-1 py-1 px-2.5 rounded hover:bg-white/5 border border-white/5 text-xs text-slate-300 transition"
                                >
                                  <span>Stats details</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </RouterLink>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}

          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Campaign form */}
            <div className="glass-panel rounded-xl p-6 h-fit bg-slate-900/40 border-white/5 lg:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-400 block border-b border-white/5 pb-3.5 mb-5 flex items-center space-x-1.5">
                <Plus className="h-4.5 w-4.5 text-indigo-400" />
                <span>Initialize Catalog</span>
              </h3>

              {creationError && (
                <div className="mb-4 flex items-start space-x-2 rounded border border-red-500/10 bg-red-950/15 p-3 text-xs text-red-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{creationError}</span>
                </div>
              )}

              {creationSuccess && (
                <div className="mb-4 flex items-start space-x-2 rounded border border-emerald-500/10 bg-emerald-950/15 p-3 text-xs text-emerald-400">
                  <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{creationSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Spring Promo 2026"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Campaign Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short meta notes for this tracking cluster folder."
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resizable-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 w-full py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Initializing folder..." : "Launch Campaign"}
                </button>

              </form>
            </div>

            {/* Campaign lists */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-400 block border-b border-white/5 pb-3.5 flex items-center space-x-1.5">
                <FolderOpen className="h-4.5 w-4.5 text-indigo-400" />
                <span>Active Campaign Catalogs ({campaigns.length})</span>
              </h3>

              {loadingList ? (
                <div className="py-24 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="glass-panel rounded-2xl p-16 text-center border-white/5">
                  <Info className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
                  <p className="text-sm text-slate-400 italic">No registered campaigns have been launched yet. Run the config block on the left!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {campaigns.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => handleSelectCampaign(c._id)}
                      className="glass-panel rounded-xl p-5 shadow-sm border-white/5 bg-slate-900/10 hover:border-white/10 transition cursor-pointer group flex flex-col justify-between min-h-[140px]"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition truncate capitalize">
                            {c.name}
                          </h4>
                          <span className="shrink-0 text-[10px] font-mono font-semibold uppercase bg-indigo-500/15 text-indigo-300 px-2 py-0.5 border border-indigo-500/10 rounded-full">
                            {c.linkCount || 0} link{c.linkCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {c.description && (
                          <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">&ldquo;{c.description}&rdquo;</p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>L: {new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className="text-indigo-400 font-semibold group-hover:underline flex items-center space-x-0.5">
                          <span>Enter directory</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Absolute campaign delete confirmation modal */}
      <AnimatePresence>
        {campaignToDelete && (
          <div 
            id="campaign-delete-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          >
            <motion.div
              id="campaign-delete-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-slate-200"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Deconstruct Campaign Directory?</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-sans">
                    Are you sure you want to delete the campaign registry <span className="font-semibold text-white">"{campaignDeleteName}"</span>? 
                  </p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed font-sans">
                    Note: All nested short links will remain active—they will just be safely un-grouped from this folder structure.
                  </p>
                </div>
              </div>

              {campaignDeleteError && (
                <div className="mt-4 p-3 rounded-lg border border-red-500/10 bg-red-950/20 text-xs text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{campaignDeleteError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  id="campaign-delete-cancel-btn"
                  onClick={() => {
                    setCampaignToDelete(null);
                    setCampaignDeleteError(null);
                  }}
                  disabled={deletingCampaign}
                  className="py-2 px-4 rounded-xl border border-white/5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 font-sans"
                >
                  Cancel
                </button>
                <button
                  id="campaign-delete-confirm-btn"
                  onClick={handleDeleteCampaign}
                  disabled={deletingCampaign}
                  className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-2 font-sans"
                >
                  {deletingCampaign ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block mr-2" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
