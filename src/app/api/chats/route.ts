import { NextResponse } from "next/server";
import User from "@/models/User";
import { Conversation } from "@/models/Conversation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Get all conversations for the user (both direct and group)
        const conversations = await Conversation.find({
            $or: [
                { memberOneId: userId },
                { memberTwoId: userId },
                { members: userId }
            ]
        })
            .populate('memberOneId', 'name image username status')
            .populate('memberTwoId', 'name image username status')
            .populate('members', 'name image username status')
            .sort({ lastMessageAt: -1 })
            .exec();

        return NextResponse.json(conversations, { status: 200 });
    } catch (error) {
        console.error("CONVERSATIONS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { memberId } = await req.json();
        const userId = new mongoose.Types.ObjectId(session.user.id);
        const otherUserId = new mongoose.Types.ObjectId(memberId);

        if (userId.toString() === otherUserId.toString()) {
            return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
        }

        // Check if user exists
        const user = await User.findById(otherUserId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            type: 'direct',
            $or: [
                { memberOneId: userId, memberTwoId: otherUserId },
                { memberOneId: otherUserId, memberTwoId: userId }
            ]
        });

        if (!conversation) {
            conversation = new Conversation({
                type: 'direct',
                memberOneId: userId,
                memberTwoId: otherUserId,
            });
            await conversation.save();
        }

        return NextResponse.json(conversation, { status: 200 });
    } catch (error) {
        console.error("CREATE_CONVERSATION_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
