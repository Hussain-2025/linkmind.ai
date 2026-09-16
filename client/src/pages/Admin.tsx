import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store.js";
import { adminAPI } from "../services/api.js";
import { useSocket } from "../hooks/useSocket.js";
import { AdminStats } from "../types.js";
import Navbar from "../components/Navbar.js";
import {
  ShieldCheck,
  Users,
  Link2,
  MousePointer,
  UserX,
  AlertTriangle,
  Info,
  Terminal,
  Activity,
  UserCheck,
  Wrench,
  Trash2,
} from "lucide-react";

export default function Admin() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"users" | "links" | "audit">("users");
  
  // Lists models
  const [userList, setUserList] = useState<any[]>([]);
  const [linkList, setLinkList] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [linksPage, setLinksPage] = useState(1);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [adminWipeTargetId, setAdminWipeTargetId] = useState<string | null>(null);
  const [adminWipeTargetCode, setAdminWipeTargetCode] = useState<string>("");
  const [wipingAdminLink, setWipingAdminLink] = useState(false);
  const [adminWipeError, setAdminWipeError] = useState<string | null>(null);

  const { activeVisitors } = useSocket();

  const loadStats = async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin telemetry stats:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const payload = await adminAPI.getUsers({ page: usersPage, limit: 15 });
      setUserList(payload.users);
    } catch (err) {
      console.error("Failed to load platform users database:", err);
    }
  };

  const loadLinks = async () => {
    try {
      const payload = await adminAPI.getLinks({ page: linksPage, limit: 15 });
      setLinkList(payload.links);
    } catch (err) {
      console.error("Failed to load platform links database:", err);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadUsers(), loadLinks()]);
      setLoading(false);
    };

    bootstrap();
  }, [user, usersPage, linksPage]);

  const handleToggleSuspend = async (usr: any) => {
    setSubmitting(usr._id);
    try {
      const res = await adminAPI.toggleSuspend(usr._id);
      
      // Update local state
      setUserList((prev) =>
        prev.map((u) => (u._id === usr._id ? { ...u, isSuspended: res.isSuspended } : u))
      );
      
      // Refresh summaries
      loadStats();
    } catch (err) {
      alert("Failed to modify user isSuspended status.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleModerateWipeLink = async () => {
    if (!adminWipeTargetId) return;
    setWipingAdminLink(true);
    setAdminWipeError(null);
    try {
      await adminAPI.moderateDeleteLink(adminWipeTargetId);
      setLinkList((prev) => prev.filter((l) => l._id !== adminWipeTargetId));
      setAdminWipeTargetId(null);
      loadStats();
    } catch (err: any) {
      console.error("Purge link from admin failed:", err);
      setAdminWipeError(err.response?.data?.message || err.message || "Failed to moderate wipe link.");
    } finally {
      setWipingAdminLink(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-transparent text-slate-200 flex flex-col justify-between">
        <Navbar activeVisitorCount={activeVisitors} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 text-center">
          <div className="max-w-md mx-auto glass-panel p-8 rounded-2xl border-red-500/20 bg-red-950/20 text-red-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold">Unauthorised Shield Access Denied</h3>
            <p className="text-xs mt-3 text-red-400/85">
              Admin Shield privileges are mapped exclusively to developer nodes and security auditors. Please report to systems operators if this restriction is misconfigured.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-slate-200 flex flex-col justify-between">
        <Navbar activeVisitorCount={activeVisitors} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-400 font-mono">CONSTRUCING ADMIN SHIELD ECOSYSTEM...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex flex-col">
      <Navbar activeVisitorCount={activeVisitors} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page title */}
        <div className="mb-8 border-b border-white/5 pb-6">
          <h2 className="font-display text-2xl font-bold text-white flex items-center space-x-2.5">
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
            <span>Admin Shield Workspace</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Conduct platform oversight, investigate malicious redirections, toggle suspensions, and review raw event audits.
          </p>
        </div>

        {/* Global Stats Numbers */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            
            <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-white/5">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Total users</span>
                <p className="text-2xl font-black font-display text-white mt-1">{stats.metrics.totalUsers}</p>
              </div>
              <div className="h-10 w-10 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-white/5">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Total links shortened</span>
                <p className="text-2xl font-black font-display text-white mt-1">{stats.metrics.totalLinks}</p>
              </div>
              <div className="h-10 w-10 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Link2 className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-white/5">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Total clicks registers</span>
                <p className="text-2xl font-black font-display text-white mt-1">{stats.metrics.totalClicks}</p>
              </div>
              <div className="h-10 w-10 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <MousePointer className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 flex items-center justify-between border-white/5">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">suspended users</span>
                <p className="text-2xl font-black font-display text-red-400 mt-1">{stats.metrics.suspendedUsers}</p>
              </div>
              <div className="h-10 w-10 rounded bg-red-500/10 text-red-400 flex items-center justify-center">
                <UserX className="h-5 w-5" />
              </div>
            </div>

          </div>
        )}

        {/* Tab triggers */}
        <div className="flex rounded-lg bg-slate-950 p-1 w-fit mb-6 border border-white/5">
          {[
            { id: "users", label: "Users Registry", icon: Users },
            { id: "links", label: "Malicious Links Filter", icon: Link2 },
            { id: "audit", label: "Event Audit Trial", icon: Terminal },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition ${
                  activeTab === t.id
                    ? "bg-indigo-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace Display Area */}
        <div className="glass-panel rounded-2xl p-6 border-white/5 bg-slate-900/40 shadow-xl overflow-hidden mb-12">
          
          {/* USER TAB CONTENT */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Platform Accounts database</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-widest font-mono">
                      <th className="py-2.5 pl-2">Username</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Role Mapping</th>
                      <th className="py-2.5 text-right pr-2">Actions Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {userList.map((u, index) => (
                      <tr key={u._id || index} className="hover:bg-white/[0.01] transition">
                        <td className="py-3.5 pl-2">
                          <span className="font-semibold text-white">{u.username}</span>
                        </td>
                        <td className="py-3.5 font-mono text-slate-300">{u.email}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize tracking-wide ${
                            u.role === "admin" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-950 text-slate-400"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {u.role === "admin" ? (
                            <span className="text-xs text-slate-500 italic font-mono uppercase">System Administrator</span>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              disabled={submitting === u._id}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                                u.isSuspended
                                  ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/25"
                                  : "bg-red-600/10 border-red-500/20 text-red-400 hover:bg-red-600/25"
                              }`}
                            >
                              {u.isSuspended ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span>Unsuspend account</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3.5 w-3.5" />
                                  <span>Suspend account</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LINKS TAB CONTENT */}
          {activeTab === "links" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">platform shortened codes and redirects index</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-widest font-mono">
                      <th className="py-2.5 pl-2">Short Code</th>
                      <th className="py-2.5">Original URL Path</th>
                      <th className="py-2.5 text-right font-mono">Clicks</th>
                      <th className="py-2.5 text-right pr-2">Action Wipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {linkList.map((ln, index) => (
                      <tr key={ln._id || index} className="hover:bg-white/[0.01] transition">
                        <td className="py-3.5 pl-2 font-mono font-bold text-indigo-400">/{ln.shortCode}</td>
                        <td className="py-3.5 max-w-[280px] truncate text-slate-400 font-mono" title={ln.originalUrl}>
                          {ln.originalUrl}
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-300">{ln.clicks || 0}</td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => {
                              setAdminWipeTargetId(ln._id);
                              setAdminWipeTargetCode(ln.shortCode);
                              setAdminWipeError(null);
                            }}
                            className="inline-flex items-center space-x-1 text-red-400 border border-red-500/20 bg-red-950/20 p-1.5 rounded-lg hover:bg-red-950/30 transition cursor-pointer"
                            title="Mod Wipe link"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-xs font-semibold pl-1 uppercase font-mono">Wipe</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT TAB CONTENT */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">System event audit logs stream</h3>
              </div>

              {stats && stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500 uppercase">AWAITING SYSTEMS TELEMETRY INTERACTIONS...</div>
              ) : (
                <div className="font-mono text-xs rounded-xl bg-slate-950 p-5 border border-white/5 space-y-4 overflow-y-auto max-h-[420px]">
                  {stats && stats.recentActivity.map((log, index) => {
                    const timeStr = new Date(log.timestamp).toLocaleTimeString();
                    const dateStr = new Date(log.timestamp).toLocaleDateString();
                    return (
                      <div key={log._id || index} className="border-b border-white/5 pb-2 mb-2 last:border-b-0 last:p-0">
                        <div className="flex flex-col sm:flex-row justify-between text-slate-500 mb-1">
                          <span>[{dateStr} {timeStr}] • Client IP: <span className="text-indigo-400">{log.ip}</span></span>
                          <span className="uppercase font-extrabold text-[#111] bg-indigo-500 px-1 rounded block">{log.action}</span>
                        </div>
                        <p className="text-slate-200">
                          User: <span className="text-yellow-400 font-bold">{log.userId ? log.userId.username : "Static Visitor Node"}</span> ({log.userId ? log.userId.email : "Anonymized Client"})
                        </p>
                        <p className="text-slate-400 mt-1 pl-4 border-l border-indigo-500/30">
                          Details: {log.details}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Absolute Admin Wipe confirmation modal */}
      <AnimatePresence>
        {adminWipeTargetId && (
          <div 
            id="admin-wipe-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          >
            <motion.div
              id="admin-wipe-modal"
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
                  <h3 className="text-lg font-semibold text-white">Administrative Override: Wipe Link?</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-sans">
                    Are you sure you want to perform a moderator wipe deletion on the shortcode <span className="font-semibold text-white">"/{adminWipeTargetCode}"</span> due to a policy breach or abusive behaviors? 
                  </p>
                  <p className="mt-1 text-xs text-red-400/80 leading-relaxed font-sans">
                    This action is absolutely non-reversible and will permanently purge the shortened link, all associated QR codes, and all telemetry metrics. This constitutes an active system-wide block.
                  </p>
                </div>
              </div>

              {adminWipeError && (
                <div className="mt-4 p-3 rounded-lg border border-red-500/10 bg-red-950/20 text-xs text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{adminWipeError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  id="admin-wipe-cancel-btn"
                  onClick={() => {
                    setAdminWipeTargetId(null);
                    setAdminWipeError(null);
                  }}
                  disabled={wipingAdminLink}
                  className="py-2 px-4 rounded-xl border border-white/5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 font-sans"
                >
                  Cancel
                </button>
                <button
                  id="admin-wipe-confirm-btn"
                  onClick={handleModerateWipeLink}
                  disabled={wipingAdminLink}
                  className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-2 font-sans"
                >
                  {wipingAdminLink ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block mr-2" />
                      <span>Wiping...</span>
                    </>
                  ) : (
                    <span>Confirm Wipe</span>
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
