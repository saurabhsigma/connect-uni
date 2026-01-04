import { NextResponse } from "next/server";
import { DirectMessage } from "@/models/DirectMessage";
import { Conversation } from "@/models/Conversation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const messages = await DirectMessage.find({
            conversationId: conversationId,
            deleted: false
        })
            .populate('senderId', 'name image username')
            .populate('replyTo')
            .sort({ createdAt: 1 })
            .exec();

        return NextResponse.json(messages, { status: 200 });
    } catch (error) {
        console.error("MESSAGES_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, attachments, replyTo } = await req.json();

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ error: "Message content is required" }, { status: 400 });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        const message = new DirectMessage({
            content,
            conversationId: conversationId,
            senderId: session.user.id,
            attachments,
            replyTo,
        });

        await message.save();
        await message.populate('senderId', 'name image username');

        // Update conversation lastMessageAt
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessageAt: new Date()
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("CREATE_MESSAGE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
