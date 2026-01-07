import { NextResponse } from "next/server";
// Re-trigger build
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers as ServerMember } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";

// Helper to generate unique invite code
function makeInviteCode(length = 8) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name, description, icon, visibility } = await req.json();

        if (!name) {
            return NextResponse.json({ message: "Server name is required" }, { status: 400 });
        }

        await dbConnect();

        // 1. Create Server
        const server = await Server.create({
            name,
            description,
            icon,
            ownerId: session.user.id,
            inviteCode: makeInviteCode(),
            visibility: visibility || "public"
        });

        // 2. Add Creator as Admin Member
        await ServerMember.create({
            userId: session.user.id,
            serverId: server._id,
            role: "admin"
        });

        // 3. Create Default Channels
        await Channel.create([
            {
                name: "general",
                type: "text",
                serverId: server._id,
                userId: session.user.id
            },
            {
                name: "General Voice",
                type: "audio",
                serverId: server._id,
                userId: session.user.id
            }
        ]);

        return NextResponse.json({ server }, { status: 201 });

    } catch (error) {
        console.error("SERVER_POST", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Find all memberships for this user
        const memberships = await ServerMember.find({ userId: session.user.id });

        // Extract server IDs
        const serverIds = memberships.map(m => m.serverId);

        // Fetch Servers
        const servers = await Server.find({ _id: { $in: serverIds } });

        return NextResponse.json(servers);

    } catch (error) {
        console.error("SERVER_GET", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
