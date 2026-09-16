import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { linksAPI, campaignsAPI } from "../services/api.js";
import { useSocket } from "../hooks/useSocket.js";
import { Link, Campaign } from "../types.js";
import Navbar from "../components/Navbar.js";
import {
  Link2,
  Lock,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Copy,
  Check,
  Star,
  Archive,
  Trash2,
  QrCode,
  Sliders,
  AlertTriangle,
  Info,
  CalendarDays,
  Play,
  Share2,
  X,
} from "lucide-react";

export default function Links() {
  const [links, setLinks] = useState<Link[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalLinksCount, setTotalLinksCount] = useState(0);

  // Form parameters
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [campaignId, setCampaignId] = useState("");

  // Configuration toggles
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter terms
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [searchString, setSearchString] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);

  // Visual helper lists
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrLink, setActiveQrLink] = useState<Link | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { activeVisitors } = useSocket();

  // Load catalogs
  const loadCampaigns = async () => {
    try {
      const data = await campaignsAPI.getList();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to fetch campaigns dropdown list:", err);
    }
  };

  const loadLinks = async (pageNum = page) => {
    setLoadingList(true);
    try {
      const payload = await linksAPI.getList({
        page: pageNum,
        limit: 10,
        search: searchString,
        filter: selectedFilter === "all" ? undefined : selectedFilter,
        campaignId: selectedCampaign || undefined,
      });

      setLinks(payload.links);
      setTotalLinksCount(payload.pagination.total);
      setTotalPages(payload.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    setPage(1);
    loadLinks(1);
  }, [selectedFilter, selectedCampaign, searchString]);

  // Handle Form Submission
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      if (!originalUrl) {
        throw new Error("Destination URL is required.");
      }

      const payload = {
        originalUrl,
        customAlias: customAlias.trim() || undefined,
        description,
        password: password.trim() || undefined,
        isOneTime,
        expiresAt: expiresAt || undefined,
        campaignId: campaignId || undefined,
      };

      await linksAPI.create(payload);
      
      setOriginalUrl("");
      setCustomAlias("");
      setDescription("");
      setPassword("");
      setIsOneTime(false);
      setExpiresAt("");
      setCampaignId("");
      setShowAdvanced(false);

      setFormSuccess("Short code compiled successfully!");
      loadLinks(1);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || "Failed to shorten link.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (linkId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleLinkFavorite = async (link: Link) => {
    try {
      const updated = await linksAPI.toggleFavorite(link._id);
      setLinks((prev) =>
        prev.map((l) => (l._id === link._id ? { ...l, isFavorite: updated.isFavorite } : l))
      );
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  const toggleLinkArchive = async (link: Link) => {
    try {
      await linksAPI.toggleArchive(link._id);
      loadLinks(); // Refresh catalog to filter out archived links
    } catch (err) {
      console.error("Archive toggle failed:", err);
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await linksAPI.delete(linkToDelete);
      setLinkToDelete(null);
      loadLinks();
    } catch (err: any) {
      console.error("Purge link failed:", err);
      setDeleteError(err.response?.data?.message || err.message || "Failed to purge link");
    } finally {
      setDeleting(false);
    }
  };

  const getAbsoluteShortUrl = (shortCode: string) => {
    const base = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${base}/r/${shortCode}`;
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col">
      <Navbar activeVisitorCount={activeVisitors} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Shortener Core workspace */}
        <div className="mb-8 font-display">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span>Shorten Link Studio</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Construct high-speed, customizable redirections with integrated geo-tracking.
          </p>
        </div>

        {/* Shortener console */}
        <div id="shortener-creator" className="glass-panel rounded-2xl p-6 mb-12 shadow-md relative overflow-hidden bg-slate-900/40">
          
          {/* Alerts */}
          {formError && (
            <div className="mb-5 flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-950/20 p-3.5 text-sm text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-5 flex items-start space-x-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-sm text-emerald-400">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleShorten} className="space-y-4">
            
            <div className="flex flex-col md:flex-row gap-4">
              
              {/* Destination URL */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1.5">
                  Destination Long URL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Link2 className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="url"
                    required
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://your-long-website-address-here.com/deep/page?id=99"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Custom slug */}
              <div className="w-full md:w-64">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1.5">
                  Custom alias <span className="text-[10px] text-slate-500 lowercase">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 text-xs font-mono">
                    /
                  </span>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    placeholder="naresh-portfolio"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-6 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

            </div>

            {/* Advanced configurations toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1 transition cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{showAdvanced ? "Hide Advanced Parameters" : "Exhibit Advanced Parameters"}</span>
            </button>

            {/* Collapsible Panel */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-white/5 bg-slate-950/40 animate-fadeIn">
                
                {/* Collapsible Card 1: Description */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Description</span>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="SaaS Landing Page"
                    className="rounded-lg border border-white/5 bg-slate-900/50 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Collapsible Card 2: Password protection */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Secret Password</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter lock code"
                      className="w-full rounded-lg border border-white/5 bg-slate-900/50 pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Collapsible Card 3: Expire date */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Expiration Cutoff</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-slate-900/50 pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Collapsible Card 4: Campaign Linkage */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Group to Campaign</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <select
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      className="w-full rounded-lg border border-white/5 bg-slate-900/50 pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
                    >
                      <option value="">None / Solo Link</option>
                      {campaigns.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Collapsible Panel checkbox: Self destruct */}
                <div className="lg:col-span-4 mt-2">
                  <label className="inline-flex items-center space-x-2.5 text-xs text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOneTime}
                      onChange={(e) => setIsOneTime(e.target.checked)}
                      className="rounded border-white/10 bg-slate-950/50 h-4 w-4 text-indigo-500 focus:ring-0"
                    />
                    <span className="flex items-center space-x-1">
                      <Lock className="h-3. w-3. text-indigo-400" />
                      <span>One-Time Burn Link (Automatically self-destructs upon first click visitor redirection)</span>
                    </span>
                  </label>
                </div>

              </div>
            )}

            {/* Action Trigger */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:brightness-110 cursor-pointer transition flex items-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Redirection is pending...</span>
                  </>
                ) : (
                  <span>Compile URL</span>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Filters control interface */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 border-b border-white/5 pb-5">
          
          {/* Section selectors */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Links" },
              { id: "favorites", label: "Favorites" },
              { id: "one-time", label: "One-Time links" },
              { id: "expired", label: "Expired" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  selectedFilter === f.id
                    ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-300"
                    : "bg-slate-900/35 border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtering selectors */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            
            {/* Find campaign drop */}
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="rounded-lg border border-white/5 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 focus:outline-none"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* General input search box */}
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                placeholder="Search shortcode..."
                className="w-full rounded-lg border border-white/5 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

          </div>

        </div>

        {/* Short shortened Links item listings */}
        {loadingList ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-400 font-mono mt-4 uppercase tracking-widest">Compiling catalog details...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center border-white/5">
            <Info className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
            <p className="text-sm text-slate-300 font-sans">No matching entries are recorded under the selected parameters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => {
              const absUrl = getAbsoluteShortUrl(link.shortCode);
              return (
                <div
                  key={link._id}
                  className="glass-panel rounded-xl p-5 shadow-sm border-white/5 bg-slate-900/20 hover:border-white/10 transition relative group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Link core metadata details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-black text-lg text-white group-hover:text-indigo-400 transition">
                          /{link.shortCode}
                        </span>
                        
                        {/* Tags list */}
                        {link.isOneTime && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Burn
                          </span>
                        )}

                        {link.password && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20">
                            Locked
                          </span>
                        )}

                        {link.expiresAt && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Expires
                          </span>
                        )}

                        {link.isArchived && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Archived
                          </span>
                        )}

                        {link.campaignId && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {typeof link.campaignId === "object" ? link.campaignId.name : "Campaign"}
                          </span>
                        )}
                      </div>

                      {/* Destination URL */}
                      <p className="text-xs text-slate-400 font-sans truncate pr-4" title={link.originalUrl}>
                        Target: <span className="hover:underline text-slate-300 font-mono">{link.originalUrl}</span>
                      </p>

                      {/* Optional meta description */}
                      {link.description && (
                        <p className="text-xs text-slate-500 italic max-w-lg truncate">
                          &ldquo;{link.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* QR and Details interactions section */}
                    <div className="flex flex-wrap items-center gap-3 lg:self-center">
                      
                      {/* Short Link display clipboard */}
                      <div className="flex items-center space-x-1.5 rounded-lg border border-white/5 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 font-mono">
                        <span className="truncate max-w-[150px] sm:max-w-none">{absUrl}</span>
                        <button
                          onClick={() => copyToClipboard(link._id, absUrl)}
                          className="text-slate-500 hover:text-white p-0.5 transition"
                          title="Copy Link"
                        >
                          {copiedId === link._id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Analytics details navigate */}
                      <a
                        href={`/links/${link._id}/details`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/25 text-xs font-semibold cursor-pointer transition"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Insights Suite</span>
                      </a>

                      {/* Display QR code button trigger */}
                      {link.qrCodeData && (
                        <button
                          onClick={() => setActiveQrLink(link)}
                          className="p-2 rounded-lg border border-white/5 bg-slate-950 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Generate QR Vector Mode"
                        >
                          <QrCode className="h-4.5 w-4.5" />
                        </button>
                      )}

                      {/* Favorite star */}
                      <button
                        onClick={() => toggleLinkFavorite(link)}
                        className={`p-2 rounded-lg border border-white/5 bg-slate-950 transition cursor-pointer ${
                          link.isFavorite ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                        title="Favorite"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>

                      {/* Archive toggle */}
                      <button
                        onClick={() => toggleLinkArchive(link)}
                        className="p-2 rounded-lg border border-white/5 bg-slate-950 text-slate-500 hover:bg-white transition cursor-pointer"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </button>

                      {/* Direct wipe */}
                      <button
                        onClick={() => {
                          setLinkToDelete(link._id);
                          setDeleteError(null);
                        }}
                        className="p-2 rounded-lg border border-white/5 bg-slate-950 text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                        title="Purge"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Absolute confirmation modal */}
      <AnimatePresence>
        {linkToDelete && (
          <div 
            id="delete-confirm-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          >
            <motion.div
              id="delete-confirm-modal"
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
                  <h3 className="text-lg font-semibold text-white">Permanently Purge Short URL?</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    Are you sure you want to permanently purge this link and all its analytics entries? Once completed, users requesting this short URL will receive a 404 error, and all historical telemetry data will be lost forever.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mt-4 p-3 rounded-lg border border-red-500/10 bg-red-950/20 text-xs text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  id="delete-cancel-btn"
                  onClick={() => {
                    setLinkToDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="py-2 px-4 rounded-xl border border-white/5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-sm transition cursor-pointer disabled:opacity-50"
                >
                  Keep Link
                </button>
                <button
                  id="delete-confirm-btn"
                  onClick={handleDeleteLink}
                  disabled={deleting}
                  className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block mr-2" />
                      <span>Purging...</span>
                    </>
                  ) : (
                    <span>Confirm Purge</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeQrLink && (
          <div 
            id="qr-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
            onClick={() => setActiveQrLink(null)}
          >
            <motion.div
              id="qr-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-slate-200 relative font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">QR Vector Engine</h3>
                    <p className="text-[10px] text-slate-400 font-mono">CODE: /{activeQrLink.shortCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveQrLink(null)}
                  className="p-1.5 rounded-lg border border-white/5 bg-slate-950 text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-xl border border-white/10 max-w-[190px] mx-auto mb-4 flex items-center justify-center">
                <img
                  src={activeQrLink.qrCodeData}
                  alt="Shortcode Link QR Vector"
                  className="h-40 w-40 object-contain block"
                />
              </div>

              <div className="text-center mb-5 space-y-1">
                <p className="text-xs text-slate-300 truncate max-w-xs mx-auto">
                  URL: <span className="font-mono text-indigo-300 font-semibold">{getAbsoluteShortUrl(activeQrLink.shortCode)}</span>
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-xs mx-auto" title={activeQrLink.originalUrl}>
                  Redirects: <span className="italic">{activeQrLink.originalUrl}</span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={activeQrLink.qrCodeData}
                  download={`qr-code-${activeQrLink.shortCode}.png`}
                  className="inline-flex items-center justify-center gap-1.5 w-full text-center text-xs font-semibold tracking-wider text-white uppercase bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2.5 transition active:scale-95"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Export PNG Graphic</span>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getAbsoluteShortUrl(activeQrLink.shortCode));
                    // Trigger custom copy check animation
                    copyToClipboard(activeQrLink._id, getAbsoluteShortUrl(activeQrLink.shortCode));
                  }}
                  className="inline-flex items-center justify-center gap-1.5 w-full text-center text-xs font-semibold tracking-wider text-slate-300 border border-white/5 bg-slate-950 hover:bg-slate-800 rounded-xl py-2.5 transition active:scale-95 cursor-pointer"
                >
                  {copiedId === activeQrLink._id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Short Address Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Connection URL</span>
                    </>
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
