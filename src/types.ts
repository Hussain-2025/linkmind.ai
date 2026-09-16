export interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isSuspended?: boolean;
  linksCount?: number;
}

export interface Campaign {
  _id: string;
  userId: string;
  name: string;
  description: string;
  linkCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  _id: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  description?: string;
  password?: string;
  isOneTime: boolean;
  hasClickedOneTime: boolean;
  expiresAt: string | null;
  isArchived: boolean;
  isFavorite: boolean;
  campaignId: any; // Can be string or populated { _id: string, name: string }
  qrCodeData: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatItem {
  _id: string; // Dynamic key (e.g., country name, device type, browser name)
  count: number;
}

export interface TimelineItem {
  _id: string; // Date string (YYYY-MM-DD)
  clicks: number;
  unique: number;
}

export interface HourlyItem {
  hour: number;
  count: number;
}

export interface LinkMetrics {
  totalClicks: number;
  uniqueClicks: number;
  deviceStats: StatItem[];
  browserStats: StatItem[];
  countryStats: StatItem[];
  referrerStats: StatItem[];
  clickTimeline: TimelineItem[];
  hourlyDistribution: HourlyItem[];
}

export interface LinkStatsResult {
  link: Link;
  metrics: LinkMetrics;
}

export interface DashboardTotals {
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
}

export interface DashboardData {
  totals: DashboardTotals;
  deviceStats: StatItem[];
  browserStats: StatItem[];
  countryStats: StatItem[];
  referrerStats: StatItem[];
  clickTimeline: TimelineItem[];
  topLinks: Link[];
}

export interface AdminStats {
  metrics: {
    totalUsers: number;
    totalLinks: number;
    totalClicks: number;
    suspendedUsers: number;
  };
  recentActivity: Array<{
    _id: string;
    userId: { _id: string; username: string; email: string } | null;
    action: string;
    details: string;
    ip: string;
    timestamp: string;
  }>;
}
