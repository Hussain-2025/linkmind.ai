import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, logoutSuccess } from "../store/store.js";
import { authAPI } from "../services/api.js";
import {
  Activity,
  Link2,
  FolderKanban,
  ShieldCheck,
  LogOut,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface NavbarProps {
  activeVisitorCount?: number;
}

export default function Navbar({ activeVisitorCount = 1 }: NavbarProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      dispatch(logoutSuccess());
      navigate("/login");
    } catch (err) {
      console.error("Logout sequence failed:", err);
    }
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Activity },
    { path: "/links", label: "My Links", icon: Link2 },
    { path: "/campaigns", label: "Campaigns", icon: FolderKanban },
  ];

  if (user?.role === "admin") {
    menuItems.push({ path: "/admin", label: "Admin Shield", icon: ShieldCheck });
  }

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Branding & Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            LinkMind <span className="text-indigo-400">AI</span>
          </span>
        </Link>

        {/* Core Navigation Items */}
        <nav className="hidden md:flex items-center space-x-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/5 text-indigo-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Real-time pulse & Profile details */}
        <div className="flex items-center space-x-4">
          
          {/* Real-time Socket Indicator */}
          <div className="hidden sm:flex items-center space-x-2 rounded-full border border-emerald-500/10 bg-emerald-950/25 px-2.5 py-1 text-xs text-emerald-400 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono">{activeVisitorCount} Live Visitor{activeVisitorCount !== 1 ? "s" : ""}</span>
          </div>

          {/* User Meta Card */}
          {user && (
            <div className="flex items-center space-x-3 border-l border-white/5 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                <span className="text-[10px] font-mono capitalize tracking-wide text-indigo-400">{user.role}</span>
              </div>
              
              <button
                id="navbar-logout-btn"
                onClick={handleLogout}
                className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                title="Log out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
