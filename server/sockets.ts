import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisPubClient, getRedisSubClient, isRedisActive } from "./services/redisService.js";

let ioInstance: SocketIOServer | null = null;
let activeCount = 0;

export function initSockets(server: HTTPServer): SocketIOServer {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Attach scaling redis-adapter if Redis is active
  if (isRedisActive()) {
    const pub = getRedisPubClient();
    const sub = getRedisSubClient();
    if (pub && sub) {
      ioInstance.adapter(createAdapter(pub, sub));
      console.log("Redis cluster Socket.IO horizontal adapter attached successfully!");
    }
  }

  ioInstance.on("connection", (socket) => {
    activeCount++;
    console.log(`Socket.IO Client connected. Total active sessions: ${activeCount}`);

    // Broadcast updated global visitor count
    ioInstance?.emit("active_visitors", { count: activeCount });

    // Handle customized campaign rooms or link room listings
    socket.on("join_link", (linkId: string) => {
      socket.join(`link:${linkId}`);
      console.log(`Client joined updates channel for link: ${linkId}`);
    });

    socket.on("join_campaign", (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      console.log(`Client joined updates channel for campaign: ${campaignId}`);
    });

    socket.on("disconnect", () => {
      activeCount = Math.max(0, activeCount - 1);
      console.log(`Socket.IO Client disconnected. Remaining: ${activeCount}`);
      ioInstance?.emit("active_visitors", { count: activeCount });
    });
  });

  return ioInstance;
}

export function getIOInstance(): SocketIOServer | null {
  return ioInstance;
}
