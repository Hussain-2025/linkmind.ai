import { GoogleGenAI } from "@google/genai";
import { redisService } from "./redisService.js";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

export interface AnalyticsSummaryInput {
  totalClicks: number;
  uniqueClicks: number;
  deviceStats: Array<{ _id: string; count: number }>;
  browserStats: Array<{ _id: string; count: number }>;
  referrerStats: Array<{ _id: string; count: number }>;
  countryStats: Array<{ _id: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

export async function generateAIAnalyticsInsights(
  linkDetails: { originalUrl: string; shortCode: string; description?: string; linkId?: string },
  stats: AnalyticsSummaryInput
): Promise<string> {
  const linkId = linkDetails.linkId || linkDetails.shortCode;
  
  // Create cache key based on link ID and hash of analytics properties (e.g., click counts, length)
  const statsHash = `clicks:${stats.totalClicks}_uni:${stats.uniqueClicks}_dev:${stats.deviceStats.length}_country:${stats.countryStats.length}`;
  const aiCacheKey = `ai:insights:${linkId}:${statsHash}`;

  try {
    // 1. Check AI response cache
    const cachedInsights = await redisService.get(aiCacheKey);
    if (cachedInsights) {
      console.log(`[AI Cache Hit] Serving cached traffic insights for key: ${aiCacheKey}`);
      return cachedInsights;
    }
  } catch (err) {
    console.warn("AI cache query failed, proceeding directly to AI execution:", err);
  }

  const client = getGeminiClient();

  // If no API Key is set, produce high-quality heuristic fallback report
  if (!client) {
    console.warn("GEMINI_API_KEY is not configured in environment. Using smart heuristic fallbacks...");
    const fallbackResponse = generateHeuristicFeedback(linkDetails, stats);
    // Cache heuristic fallbacks for 5 minutes
    try {
      await redisService.set(aiCacheKey, fallbackResponse, 300);
    } catch {}
    return fallbackResponse;
  }

  try {
    const prompt = `
You are LinkMind AI, an advanced, elite AI Traffic Systems Architect and Marketing Insights Engine.
Analyze the following link properties and aggregated traffic dataset to output a high-impact, actionable, list-based summary of insights for the user.

LINK METADATA:
- Original URL: ${linkDetails.originalUrl}
- Shortened Code: ${linkDetails.shortCode}
- Intended Description/Context: ${linkDetails.description || "N/A"}

TRAFFIC ANONYMIZED METRICS:
- Total Clicks: ${stats.totalClicks}
- Unique Visitors: ${stats.uniqueClicks}
- Country Geolocation Breakdown: ${JSON.stringify(stats.countryStats)}
- Access Device Profiles: ${JSON.stringify(stats.deviceStats)}
- User-Agent Web Browsers: ${JSON.stringify(stats.browserStats)}
- Referral Channels: ${JSON.stringify(stats.referrerStats)}
- Hourly Activity Profile (0-23 UTC Distribution): ${JSON.stringify(stats.hourlyDistribution)}

TASK:
Provide a highly professional markdown-formatted response with the following sections.
Keep explanations punchy, technical, and full of clear tactical optimization recommendations.

1. **Traffic Summary**: 2-3 sentences explaining current performance and click trajectory.
2. **Audience Demographics & Core Channels**: Discuss countries, browsing habits, and whether traffic is primarily coming from specific platforms or direct entry.
3. **Daily Cycle & Best Posting Times**: Analyze the hourly activity profile to suggest 2 specific times (in UTC format) to share updates on this link to maximize click-through-rates.
4. **Actionable Growth Tactics**: 3 concrete, specific marketing tips based on this data (e.g., if mobile is dominant, optimize landing pages; if a specific referrer is strong, double-down).

Avoid meta-commentary. Output pure, clean markdown.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the marketing data scientists of LinkMind AI. Formulate analytical reports of high value.",
        temperature: 0.2,
      },
    });

    const aiText = response.text || generateHeuristicFeedback(linkDetails, stats);

    // 2. Populate AI Cache (Cache AI response for 30 minutes / 1800s)
    try {
      await redisService.set(aiCacheKey, aiText, 1800);
      console.log(`[AI Cache Set] Cached AI report for ${linkId} valid for 30 minutes.`);
    } catch (err) {
      console.error("Failed storing AI response on cache pool:", err);
    }

    return aiText;
  } catch (err) {
    console.error("Gemini API call failed:", err);
    return generateHeuristicFeedback(linkDetails, stats);
  }
}

/**
 * Heuristic fallback so that the application is fully interactive even without a valid Gemini API Key!
 */
function generateHeuristicFeedback(linkDetails: any, stats: AnalyticsSummaryInput): string {
  const topDevice = stats.deviceStats[0]?._id || "Desktop";
  const topBrowser = stats.browserStats[0]?._id || "Chrome";
  const topCountry = stats.countryStats[0]?._id || "Unknown Region";
  const topReferrer = stats.referrerStats[0]?._id || "Direct Channels";

  const totalClicks = stats.totalClicks;
  let summary = `Your link is showing active momentum with **${totalClicks} total clicks** of which **${stats.uniqueClicks} are unique visitors**. `;
  if (totalClicks === 0) {
    summary = "No click traffic has been registered yet. Share this shortened link first to unlock active AI predictions!";
  }

  // Calculate best click times
  let peakHoursStr = "between 6 PM to 10 PM UTC";
  if (stats.hourlyDistribution.length > 0) {
    const sortedHours = [...stats.hourlyDistribution].sort((a, b) => b.count - a.count);
    const topHour1 = sortedHours[0]?.hour;
    const topHour2 = sortedHours[1]?.hour;
    if (topHour1 !== undefined) {
      peakHoursStr = `${topHour1}:00-00 and ${(topHour1 + 2) % 24}:00 UTC`;
    }
  }

  return `### LinkMind AI — Local Heuristic Analytics

${summary}

#### 🎯 Key Insights & Trends
- **Primary Geolocation**: The majority of traffic originates from **${topCountry}**, suggesting highly targeted regional interest.
- **Device & Ecosystem Choice**: **${topDevice}** utilizes a **${topBrowser}** user agent configuration. Standardize responsive styles for this screen ecosystem.
- **Inbound Gateways**: **${topReferrer}** drives the bulk of engagement. Double down on this social channel for subsequent campaigns.

#### ⏰ Peak Hourly Distribution & Optimal Posting Slots
- Our telemetry detects maximum click volumes around **${peakHoursStr}**.
- We recommend batching your communications or social announcements approximately **30–45 minutes prior** to this peak window to ride the user traffic curve.

#### 🚀 Practical Optimization Roadmap
1. **Targeted Funnels**: Run responsive landing pages emphasizing loading speeds appropriate for **${topDevice}** connections under **${topBrowser}**.
2. **Channel Expansion**: Expand tracking parameters to compare paid search ads vs organic link placement in ${topReferrer}.
3. **Campaign Archiving**: Tie other similar links targeting ${topCountry} to consolidated analytics dashboards.
`;
}
