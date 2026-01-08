import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as ServerIO } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track WebRTC signaling participants per room
const socketUserMap = new Map<string, string>();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // parse url properly with query string support for socket.io
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request", err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO on the custom server
  const io = new ServerIO(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Track online users
  const onlineUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("[SOCKET] Connected:", socket.id);

    socket.on("register-user", (userId: string) => {
      onlineUsers.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);
      io.emit("user:online", userId);
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit("users:online", onlineUserIds);
      console.log(`[USER] Registered: ${userId}`);
    });

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log("[ROOM] Joined:", { socketId: socket.id, roomId });
    });

    socket.on("send-message", (message: any) => {
      const room = message.channelId || message.conversationId || message.room;
      console.log(`[MESSAGE] Room: ${room}`);
      if (room) {
        io.to(room).emit("new-message", message);
      }
    });

    socket.on("typing", (data: any) => {
      const room = data.room || data.channelId || data.conversationId;
      if (room) {
        socket.to(room).emit("typing", data);
      }
    });

    socket.on("friend:request-sent", (data: { to: string }) => {
      const targetSocketId = onlineUsers.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request-received");
        io.to(targetSocketId).emit("friend:update");
      }
    });

    socket.on("friend:respond", (data: { to: string; action: string }) => {
      const targetSocketId = onlineUsers.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:update");
      }
    });

    socket.on("disconnect", () => {
      console.log("[SOCKET] Disconnected:", socket.id);

      // Clean up user
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("user:offline", userId);
          console.log(`[USER] Disconnected: ${userId}`);
          break;
        }
      }

      socketUserMap.delete(socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
