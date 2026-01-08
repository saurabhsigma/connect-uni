import { AccessToken } from "livekit-server-sdk";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const room = req.query.room as string;
    const username = req.query.username as string;

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!room) {
        return res.status(400).json({ error: 'Missing "room" query parameter' });
    } else if (!username) {
        return res.status(400).json({ error: 'Missing "username" query parameter' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        console.error("Server misconfigured. Missing environment variables:");
        if (!apiKey) console.error("- LIVEKIT_API_KEY is missing");
        if (!apiSecret) console.error("- LIVEKIT_API_SECRET is missing");
        if (!wsUrl) console.error("- NEXT_PUBLIC_LIVEKIT_URL is missing");
        return res.status(500).json({ error: "Server misconfigured" });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity: username });

    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();

    res.status(200).json({ token });
}
