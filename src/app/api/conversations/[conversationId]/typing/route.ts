import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Conversation } from "@/models/Conversation";
import { TypingStatus } from "@/models/TypingStatus";

const RECENT_WINDOW_MS = 6000; // typing considered active within this window

// Ensure this route is always dynamic (no caching at the edge)
export const dynamic = "force-dynamic";

async function ensureMember(conversationId: string, userId: string) {
    await dbConnect();
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return { ok: false, status: 404, message: "Not found" } as const;

    const isMember = conversation.memberOneId.toString() === userId || conversation.memberTwoId.toString() === userId;
    if (!isMember) return { ok: false, status: 403, message: "Access Denied" } as const;

    return { ok: true, conversation } as const;
}

export async function GET(req: Request, props: { params: Promise<{ conversationId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;
    const membership = await ensureMember(conversationId, session.user.id);
    if (!membership.ok) {
        return NextResponse.json({ message: membership.message }, { status: membership.status });
    }

    const cutoff = new Date(Date.now() - RECENT_WINDOW_MS);
    const typing = await TypingStatus.findOne({
        conversationId,
        userId: { $ne: session.user.id },
        updatedAt: { $gte: cutoff }
    });

    return NextResponse.json({ typing: Boolean(typing) }, { status: 200 });
}

export async function POST(req: Request, props: { params: Promise<{ conversationId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;
    const { typing } = await req.json();

    const membership = await ensureMember(conversationId, session.user.id);
    if (!membership.ok) {
        return NextResponse.json({ message: membership.message }, { status: membership.status });
    }

    if (typing) {
        await TypingStatus.findOneAndUpdate(
            { conversationId, userId: session.user.id },
            { $set: { updatedAt: new Date() } },
            { upsert: true, new: true }
        );
    } else {
        await TypingStatus.deleteOne({ conversationId, userId: session.user.id });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
}
