import axios from "axios";
import { User, Link, Campaign, DashboardData, LinkStatsResult, AdminStats } from "../types.js";

const client = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for HttpOnly cookie exchange
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// Outgoing Request Interceptor: Attach authentication fallback headers
client.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    if (refreshToken) {
      config.headers["X-Refresh-Token"] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Incoming Response Interceptor: Handle Token Expired (401) and seamless background refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          // Attempt atomic refresh
          const refreshRes = await axios.post("/api/auth/refresh", { refreshToken });
          const newAccess = refreshRes.data.accessToken;
          const newRefresh = refreshRes.data.refreshToken;
          
          if (newAccess) {
            localStorage.setItem("accessToken", newAccess);
            if (newRefresh) {
              localStorage.setItem("refreshToken", newRefresh);
            }
            
            // Retry the original request with the renewed token
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            if (newRefresh) {
              originalRequest.headers["X-Refresh-Token"] = newRefresh;
            }
            return client(originalRequest);
          }
        } catch (refreshErr) {
          // If refresh itself fails, the session is fully expired
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  register: async (data: any): Promise<User> => {
    const res = await client.post<any>("/auth/register", data);
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }
    if (res.data.refreshToken) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
    }
    return res.data;
  },
  login: async (data: any): Promise<User> => {
    const res = await client.post<any>("/auth/login", data);
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }
    if (res.data.refreshToken) {
      localStorage.setItem("refreshToken", res.data.refreshToken);
    }
    return res.data;
  },
  logout: async (): Promise<void> => {
    try {
      await client.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
  getProfile: async (): Promise<User> => {
    const res = await client.get<User>("/auth/profile");
    return res.data;
  },
};

// Links endpoints
export const linksAPI = {
  create: async (data: any): Promise<Link> => {
    const res = await client.post<Link>("/links", data);
    return res.data;
  },
  getList: async (params?: { search?: string; filter?: string; campaignId?: string; page?: number; limit?: number }) => {
    const res = await client.get<{ links: Link[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>("/links", { params });
    return res.data;
  },
  update: async (id: string, data: any): Promise<Link> => {
    const res = await client.put<Link>(`/links/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/links/${id}`);
  },
  toggleFavorite: async (id: string): Promise<{ id: string; isFavorite: boolean }> => {
    const res = await client.patch<{ id: string; isFavorite: boolean }>(`/links/${id}/favorite`);
    return res.data;
  },
  toggleArchive: async (id: string): Promise<{ id: string; isArchived: boolean }> => {
    const res = await client.patch<{ id: string; isArchived: boolean }>(`/links/${id}/archive`);
    return res.data;
  },
  getStats: async (id: string): Promise<LinkStatsResult> => {
    const res = await client.get<LinkStatsResult>(`/links/${id}/stats`);
    return res.data;
  },
  getAIInsights: async (id: string): Promise<{ insights: string }> => {
    const res = await client.post<{ insights: string }>(`/links/${id}/ai-insights`);
    return res.data;
  },
  unlock: async (code: string, data: { password: any }) => {
    const res = await client.post<{ originalUrl: string }>(`/r/unlock/${code}`, data);
    return res.data;
  },
};

// Campaigns endpoints
export const campaignsAPI = {
  create: async (data: { name: string; description?: string }): Promise<Campaign> => {
    const res = await client.post<Campaign>("/campaigns", data);
    return res.data;
  },
  getList: async (): Promise<Campaign[]> => {
    const res = await client.get<Campaign[]>("/campaigns");
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/campaigns/${id}`);
  },
  getStats: async (id: string): Promise<{ campaign: Campaign; links: Link[]; metrics: any }> => {
    const res = await client.get<{ campaign: Campaign; links: Link[]; metrics: any }>(`/campaigns/${id}/stats`);
    return res.data;
  },
};

// Global Analytics endpoints
export const analyticsAPI = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await client.get<DashboardData>("/analytics/dashboard");
    return res.data;
  },
};

// Admin endpoints
export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const res = await client.get<AdminStats>("/admin/stats");
    return res.data;
  },
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await client.get<{ users: User[]; pagination: any }>("/admin/users", { params });
    return res.data;
  },
  toggleSuspend: async (id: string): Promise<{ id: string; isSuspended: boolean }> => {
    const res = await client.patch<{ id: string; isSuspended: boolean }>(`/admin/users/${id}/suspend`);
    return res.data;
  },
  getLinks: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await client.get<{ links: any[]; pagination: any }>("/admin/links", { params });
    return res.data;
  },
  moderateDeleteLink: async (id: string): Promise<void> => {
    await client.delete(`/admin/links/${id}`);
  },
};

export default client;
