import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { store, RootState, authSuccess, authFailure, setInitialized } from "./store/store.js";
import { authAPI } from "./services/api.js";

// Page Views
import Login from "./pages/Login.js";
import Dashboard from "./pages/Dashboard.js";
import Links from "./pages/Links.js";
import LinkDetails from "./pages/LinkDetails.js";
import Campaigns from "./pages/Campaigns.js";
import Admin from "./pages/Admin.js";
import Unlock from "./pages/Unlock.js";

function AppContent() {
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((state: RootState) => state.auth);

  // Restore authenticated session profile on first boot (cookie checking)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const profile = await authAPI.getProfile();
        dispatch(authSuccess(profile));
      } catch (err) {
        dispatch(setInitialized());
      }
    };
    restoreSession();
  }, [dispatch]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-400 font-mono tracking-wider">RESTORING WORKSPACE CONTEXT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans relative overflow-hidden flex flex-col">
      {/* Background Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Routes>
          {/* Public Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/unlock/:code" element={<Unlock />} />

          {/* Protected Pages Gateways */}
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/links"
            element={user ? <Links /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/links/:id/details"
            element={user ? <LinkDetails /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/campaigns"
            element={user ? <Campaigns /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={
              user ? (
                user.role === "admin" ? (
                  <Admin />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Default Catchall */}
          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}
