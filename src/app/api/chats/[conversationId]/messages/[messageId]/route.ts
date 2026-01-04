import { NextResponse } from "next/server";
import { DirectMessage } from "@/models/DirectMessage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
    try {
        const { conversationId, messageId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content } = await req.json();

        const message = await DirectMessage.findOne({
            _id: new mongoose.Types.ObjectId(messageId),
            conversationId: conversationId,
            senderId: session.user.id
        });

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        message.content = content;
        message.edited = true;
        await message.save();

        return NextResponse.json(message, { status: 200 });
    } catch (error) {
        console.error("UPDATE_MESSAGE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
    try {
        const { conversationId, messageId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const message = await DirectMessage.findOne({
            _id: new mongoose.Types.ObjectId(messageId),
            conversationId: conversationId,
            senderId: session.user.id
        });

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        message.deleted = true;
        await message.save();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("DELETE_MESSAGE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
