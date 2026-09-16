import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeVisitors, setActiveVisitors] = useState<number>(1);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to standard relative socket endpoint
    const socket = io({
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connection established successfully");
    });

    socket.on("active_visitors", (data: { count: number }) => {
      if (data && typeof data.count === "number") {
        setActiveVisitors(data.count);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToLink = (linkId: string, callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("join_link", linkId);
    socket.on("click_registered", (data) => {
      if (data.linkId === linkId) {
        callback(data);
      }
    });

    return () => {
      socket.off("click_registered");
    };
  };

  const subscribeToGlobalClicks = (callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("click_registered", (data) => {
      callback(data);
    });

    return () => {
      socket.off("click_registered");
    };
  };

  return {
    isConnected,
    activeVisitors,
    subscribeToLink,
    subscribeToGlobalClicks,
  };
}
