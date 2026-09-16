import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { linksAPI } from "../services/api.js";
import { ShieldAlert, KeyRound, AlertTriangle } from "lucide-react";

export default function Unlock() {
  const { code } = useParams<{ code: string }>();
  
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setErrorMsg("");
    setSubmitting(true);

    try {
      // Validate credentials at security gate endpoint
      const res = await linksAPI.unlock(code, { password });
      
      // Perform authoritative relocation to original destination URL
      window.location.replace(res.originalUrl);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Invalid authentication passcode.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4 text-slate-200">
      
      {/* Background accents */}
      <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-red-500/10 blur-[100px]" />

      <div className="w-full max-w-sm glass-panel rounded-2xl p-8 border-white/5 bg-slate-905/35 shadow-2xl relative">
        
        {/* Lock header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 mb-4 animate-pulse">
            <ShieldAlert className="h-5 w-5 text-pink-400" />
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight">Security Lock Engaged</h2>
          <p className="text-xs text-slate-400 mt-1">
            This shortened redirection code is password-restricted by its manager.
          </p>
        </div>

        {/* Global Error label */}
        {errorMsg && (
          <div className="mb-4 flex items-start space-x-2 rounded bg-red-950/20 border border-red-500/15 p-3 text-xs text-red-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1">Passcode Credentials</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full rounded-lg border border-white/10 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2.5 text-xs tracking-wider uppercase shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Access verification..." : "Unlock Code"}
          </button>

        </form>

      </div>
    </div>
  );
}
