import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIo = NextApiResponse & {
    socket: any & {
        server: NetServer & {
            io: ServerIO;
        };
    };
};

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as any;

        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
        });

        io.on("connection", (socket) => {
            console.log("SERVER: Socket Connected:", socket.id);

            socket.on("join-room", (roomId: string) => {
                socket.join(roomId);
                console.log(`SERVER: Socket ${socket.id} joined room ${roomId}`);
            });

            socket.on("send-message", (message: any) => {
                const room = message.channelId || message.conversationId || message.room;
                console.log(`SERVER: Receive send-message for room: ${room}`);
                if (room) {
                    console.log(`SERVER: Broadcasting to ${room}`);
                    io.to(room).emit("new-message", message);
                } else {
                    console.log("SERVER: Missing Room ID in message:", message);
                }
            });

            socket.on("typing", (data: any) => {
                const room = data.room || data.channelId || data.conversationId;
                if (room) {
                    socket.to(room).emit("typing", data);
                }
            });

            socket.on("disconnect", () => {
                console.log("SERVER: Socket Disconnected:", socket.id);
            });
        });

        res.socket.server.io = io;
    } else {
        console.log("SERVER: Socket.io already running");
    }

    res.end();
};

export default ioHandler;
