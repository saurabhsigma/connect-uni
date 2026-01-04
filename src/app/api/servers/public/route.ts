import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers as ServerMember } from "@/models/ServerMembers";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // 1. Get IDs of servers user is already in
        const myMemberships = await ServerMember.find({ userId: session.user.id });
        const myServerIds = myMemberships.map(m => m.serverId);

        // 2. Find Public Servers NOT in that list
        const publicServers = await Server.find({
            visibility: "public",
            _id: { $nin: myServerIds }
        }).limit(20);

        return NextResponse.json(publicServers);

    } catch (error) {
        console.error("SERVER_PUBLIC_GET", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
