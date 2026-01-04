import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers as ServerMember } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";

export async function GET(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { serverId } = params;
        await dbConnect();

        // 1. Get Server Details
        const server = await Server.findById(serverId);
        if (!server) return NextResponse.json({ message: "Not found" }, { status: 404 });

        // 2. Check Membership
        const member = await ServerMember.findOne({ serverId, userId: session.user.id });
        // NOTE: If public, maybe allow viewing basic info? 
        // For now, allow viewing if member OR if server is public (but maybe restricted data).
        // The UI redirects if fetch fails, so if not member and private, should fail.

        if (!member && server.visibility === 'private') {
            return NextResponse.json({ message: "Access Denied" }, { status: 403 });
        }

        // 3. Get Channels
        const channels = await Channel.find({ serverId }).sort({ position: 1 });

        return NextResponse.json({
            server,
            channels,
            member // Return member details (roles, etc)
        });

    } catch (error) {
        console.error("SERVER_ID_GET", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
