// This file is deprecated - Socket.IO is now handled by /server.ts
// The custom server handles all WebRTC signaling
// This file should not be used
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "Socket.IO is handled by custom server. Please use /server.ts" });
}
