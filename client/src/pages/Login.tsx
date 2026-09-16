import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { authStart, authSuccess, authFailure } from "../store/store.js";
import { authAPI } from "../services/api.js";
import { RootState } from "../store/store.js";
import { Sparkles, Terminal, Mail, Lock, User, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  // Check URL query parameters for click redirect errors
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("err");
    if (err) {
      if (err === "not_found") setFormError("The shortened code clicked does not exist code database.");
      else if (err === "expired") setFormError("This link has passed its operational expiration date.");
      else if (err === "burned") setFormError("This one-time link has already been securely visited/burned.");
      else if (err === "archived") setFormError("This shortened directory has been administratively archived.");
    }
  }, [location.search]);

  // Navigate to dashboard if logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    dispatch(authStart());

    try {
      if (isRegister) {
        if (!username || !email || !password) {
          throw new Error("Ensure all registration fields are completed.");
        }
        const data = await authAPI.register({ username, email, password });
        dispatch(authSuccess(data));
        setSuccessMsg("Registration successful! Initiating first session...");
      } else {
        if (!email || !password) {
          throw new Error("Please enter your registered email and password.");
        }
        const data = await authAPI.login({ email, password });
        dispatch(authSuccess(data));
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Failed to finalize session transaction.";
      dispatch(authFailure(errMsg));
      setFormError(errMsg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4 text-slate-200 relative overflow-hidden">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="w-full max-w-md">
        
        {/* Hub Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            LinkMind AI
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-sans">
            AI URL Shortening & Real-time Analytics Engine
          </p>
        </div>

        {/* Form Workspace */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative border-white/5 bg-slate-900/40">
          
          {/* Section Selector Tab */}
          <div className="mb-6 flex rounded-lg bg-slate-950 p-1">
            <button
              onClick={() => {
                setIsRegister(false);
                setFormError("");
                setSuccessMsg("");
              }}
              className={`w-1/2 rounded-md py-2 text-sm font-medium transition ${
                !isRegister ? "bg-indigo-600 font-semibold text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setFormError("");
                setSuccessMsg("");
              }}
              className={`w-1/2 rounded-md py-2 text-sm font-medium transition ${
                isRegister ? "bg-indigo-600 font-semibold text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alert messages */}
          {formError && (
            <div className="mb-5 flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-sm text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start space-x-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Element */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input for Register */}
            {isRegister && (
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">
                  Full Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., JohnDoe"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., example@domain.com"
                  className="w-full rounded-lg border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">
                Password Lock
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:brightness-110 focus:outline-none transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing Session...</span>
                </>
              ) : (
                <span>{isRegister ? "Join LinkMind AI" : "Access Workspace"}</span>
              )}
            </button>

          </form>

          {/* Quick Sandbox Login Sandbox details */}
          <div className="mt-6 border-t border-white/5 pt-4">
            <div className="rounded border border-indigo-500/10 bg-indigo-950/15 p-3 text-[11px] text-indigo-300 font-mono">
              <div className="flex items-center space-x-1.5 mb-1 text-slate-300">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold uppercase tracking-wider">Fast-Track credentials</span>
              </div>
              <p>For instant testing inside AI Studio, type any email & password. It automates creation immediately!</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
