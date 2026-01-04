import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { DirectMessage } from "@/models/DirectMessage";
import { Conversation } from "@/models/Conversation";

export async function GET(req: Request, props: { params: Promise<{ conversationId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { conversationId } = params;
        await dbConnect();

        // Verify membership
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return NextResponse.json({ message: "Not found" }, { status: 404 });

        const isMember = conversation.memberOneId.toString() === session.user.id ||
            conversation.memberTwoId.toString() === session.user.id;

        if (!isMember) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        // Fetch Messages
        const messages = await DirectMessage.find({ conversationId })
            .populate("senderId", "name image")
            .sort({ createdAt: 1 }); // Oldest first for chat log

        return NextResponse.json(messages, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ conversationId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { conversationId } = params;
        const { content, attachments } = await req.json();

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ message: "Content or attachments required" }, { status: 400 });
        }

        await dbConnect();

        // Verify membership
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return NextResponse.json({ message: "Not found" }, { status: 404 });

        const isMember = conversation.memberOneId.toString() === session.user.id ||
            conversation.memberTwoId.toString() === session.user.id;

        if (!isMember) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        const message = await DirectMessage.create({
            content: content || "",
            conversationId,
            senderId: session.user.id,
            attachments: attachments || []
        });

        // Update conversation lastMessageAt
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populatedMsg = await DirectMessage.findById(message._id).populate("senderId", "name image");

        return NextResponse.json(populatedMsg, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
