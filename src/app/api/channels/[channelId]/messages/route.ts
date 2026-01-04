import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { Channel } from "@/models/Channel";
import { ServerMembers } from "@/models/ServerMembers";

export async function GET(req: Request, props: { params: Promise<{ channelId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { channelId } = params;
        await dbConnect();

        // Pagination could be added here
        const messages = await Message.find({ channelId })
            .populate("senderId", "name image")
            .populate("memberId")
            .sort({ createdAt: 1 }); // Oldest first for chat history

        return NextResponse.json(messages);

    } catch (error) {
        console.error("[MESSAGES_GET]", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ channelId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { channelId } = params;
        const { content, fileUrl } = await req.json(); // Schema uses fileUrl (single string?) or check schema

        if (!content && !fileUrl) return NextResponse.json({ message: "Content required" }, { status: 400 });

        await dbConnect();

        const channel = await Channel.findById(channelId);
        if (!channel) return NextResponse.json({ message: "Channel not found" }, { status: 404 });

        const member = await ServerMembers.findOne({ serverId: channel.serverId, userId: session.user.id });
        if (!member) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        const message = await Message.create({
            content,
            fileUrl, // Adjust based on schema if it supports array 'attachments'
            channelId,
            memberId: member._id,
            senderId: session.user.id
        });

        const fullMessage = await Message.findById(message._id)
            .populate("memberId")
            .populate("senderId", "name image");

        return NextResponse.json(fullMessage);

    } catch (error) {
        console.error("[MESSAGES_POST]", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
