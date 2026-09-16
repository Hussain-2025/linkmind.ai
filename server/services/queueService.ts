import { Queue, Worker } from "bullmq";
import { Analytics } from "../models/Analytics.js";
import { Link } from "../models/Link.js";
import { getIOInstance } from "../sockets.js";
import { getRedisClient, getQueueRedisClient, isRedisActive } from "./redisService.js";
import { getGeoIP } from "../utils/geoLookup.js";

// Queue Configuration Name
const ANALYTICS_QUEUE_NAME = "analytics-ingestion";

let analyticsQueue: any = null;
let queueWorker: any = null;

// Local In-Memory queue fallback for standalone local developments
const memoryQueue: any[] = [];
let isProcessingMemoryQueue = false;

// Sliding batch config
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 1500;
let flushTimer: NodeJS.Timeout | null = null;

// Clean parsing of user agent
interface UserAgentData {
  browser: string;
  os: string;
  device: string;
}

function parseUserAgent(uaString: string | undefined): UserAgentData {
  const ua = uaString || "";
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  if (ua.includes("Firefox") && !ua.includes("Seamonkey")) {
    browser = "Firefox";
  } else if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) {
    browser = "Chrome";
  } else if (ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Chromium")) {
    browser = "Safari";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
  } else if (ua.includes("MSIE") || ua.includes("Trident")) {
    browser = "Internet Explorer";
  }

  if (ua.includes("Windows NT")) {
    os = "Windows";
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) {
    os = "macOS";
  } else if (ua.includes("Android")) {
    os = "Android";
    device = "Mobile";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
    device = ua.includes("iPad") ? "Tablet" : "Mobile";
  } else if (ua.includes("Linux") && !ua.includes("Android")) {
    os = "Linux";
  }

  if (device === "Desktop" && (ua.includes("Mobi") || ua.includes("Phone") || ua.includes("iOS"))) {
    device = "Mobile";
  }

  return { browser, os, device };
}

/**
 * Main logical function that processes analytical tracking tasks
 */
export async function processAnalyticsJob(jobData: {
  linkId: string;
  ip: string;
  userAgent?: string;
  referer?: string;
  campaignId?: string;
  timestamp: string;
}) {
  const { linkId, ip, userAgent, referer, timestamp } = jobData;

  try {
    const { browser, os, device } = parseUserAgent(userAgent);
    const { country, city } = getGeoIP(ip);

    // Uniqueness constraint: checked within 24hr window
    const oneDayAgo = new Date(new Date(timestamp).getTime() - 24 * 60 * 60 * 1000);
    const previousClick = await Analytics.findOne({
      linkId,
      ip,
      timestamp: { $gte: oneDayAgo },
    });
    const isUnique = !previousClick;

    // Create record in Database
    const clickDoc = await Analytics.create({
      linkId,
      ip,
      country,
      city,
      device,
      os,
      browser,
      referrer: referer || "Direct",
      isUnique,
      timestamp: new Date(timestamp),
    });

    // Realtime websocket emit
    const io = getIOInstance();
    if (io) {
      io.emit("click_registered", {
        linkId,
        campaignId: jobData.campaignId,
        click: clickDoc,
      });
      io.emit("pulse_visitor");
    }

    return clickDoc;
  } catch (err) {
    console.error("Failed executing background analytics tracking queue job:", err);
    throw err;
  }
}

/**
 * Core In-Memory Fallback sliding processing mechanism
 */
async function processInMemBatch() {
  if (memoryQueue.length === 0 || isProcessingMemoryQueue) return;
  isProcessingMemoryQueue = true;

  const batch = memoryQueue.splice(0, BATCH_SIZE);
  console.log(`Processing sliding-batch of telemetry analytics events: ${batch.length} jobs remaining...`);

  try {
    // Process all jobs in parallel
    await Promise.allSettled(batch.map((job) => processAnalyticsJob(job)));
  } catch (err) {
    console.error("Error running sliding-batch background drain queue:", err);
  } finally {
    isProcessingMemoryQueue = false;
    if (memoryQueue.length > 0) {
      setImmediate(processInMemBatch);
    }
  }
}

/**
 * Initialize Queue Service
 */
export function initQueueSystem() {
  const isRedis = isRedisActive();

  if (isRedis) {
    console.log("Setting up high-throughput BullMQ Redis Queue system for asynchronous click telemetries...");
    const connection = getQueueRedisClient();

    // Setup BullMQ ingestion Queue
    analyticsQueue = new Queue(ANALYTICS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    });

    // Setup Worker processes
    queueWorker = new Worker(
      ANALYTICS_QUEUE_NAME,
      async (job) => {
        await processAnalyticsJob(job.data);
      },
      { connection, concurrency: 5 }
    );

    queueWorker.on("completed", (job: any) => {
      // Clean telemetry hooks
    });

    queueWorker.on("failed", (job: any, err: any) => {
      console.error(`BullMQ analytical packet failed on job [${job.id}]:`, err.message);
    });
  } else {
    console.log("BullMQ skipped due to in-memory fallback. Enabling local slider-batch queues...");
    // Local flush scheduler trigger
    flushTimer = setInterval(processInMemBatch, FLUSH_INTERVAL_MS);
  }
}

/**
 * Push click telemetry task payload onto system queue for asynchronous execution
 */
export async function enqueueClickTelemetry(payload: {
  linkId: string;
  ip: string;
  userAgent?: string;
  referer?: string;
  campaignId?: string;
  timestamp: string;
}) {
  const isRedis = isRedisActive();

  if (isRedis && analyticsQueue) {
    try {
      await analyticsQueue.add("visitor-click", payload);
    } catch (err: any) {
      console.error("BullMQ push failed, fallback routing to local memory queue:", err.message);
      memoryQueue.push(payload);
    }
  } else {
    // Stage inside local sliding memory queue
    memoryQueue.push(payload);
    if (memoryQueue.length >= BATCH_SIZE) {
      setImmediate(processInMemBatch);
    }
  }
}
