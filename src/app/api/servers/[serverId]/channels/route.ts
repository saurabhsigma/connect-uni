import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Channel } from "@/models/Channel";
import { ServerMembers } from "@/models/ServerMembers";

export async function POST(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        const { name, type, isPrivate, allowedUsers } = await req.json();

        if (!name || !type) return NextResponse.json({ message: "Invalid values" }, { status: 400 });

        await dbConnect();

        // Check permissions 
        const member = await ServerMembers.findOne({ serverId, userId: session.user.id });
        if (!member) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

        // Corrected Schema Fields
        const channel = await Channel.create({
            name,
            type,
            serverId,
            isPrivate: isPrivate, // Matches Schema 'isPrivate'
            allowedUsers: isPrivate ? allowedUsers : [], // Matches Schema 'allowedUsers'
            userId: session.user.id // Matches Schema 'userId' (Creator)
        });

        return NextResponse.json(channel);

    } catch (error: any) {
        console.error("CHANNEL_POST", error);
        return NextResponse.json({
            message: "Internal Error",
            details: error.message
        }, { status: 500 });
    }
}
