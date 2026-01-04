import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Channel } from "@/models/Channel";
import { ServerMembers } from "@/models/ServerMembers";

export async function GET(req: Request, props: { params: Promise<{ channelId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { channelId } = params;
        await dbConnect();

        const channel = await Channel.findById(channelId);
        if (!channel) return NextResponse.json({ message: "Channel not found" }, { status: 404 });

        // Check if user is member of server
        const member = await ServerMembers.findOne({ serverId: channel.serverId, userId: session.user.id });
        if (!member) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        return NextResponse.json(channel);

    } catch (error) {
        console.error("CHANNEL_GET", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
