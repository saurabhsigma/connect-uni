import { NextResponse } from "next/server";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = new mongoose.Types.ObjectId(session.user.id);
        const targetUserId = new mongoose.Types.ObjectId(userId);

        if (currentUserId.toString() === targetUserId.toString()) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentUser = await User.findById(currentUserId);

        // Check if already following
        if (currentUser?.following?.includes(targetUserId)) {
            return NextResponse.json({ error: "Already following" }, { status: 400 });
        }

        // Add to current user's following
        await User.findByIdAndUpdate(currentUserId, {
            $push: { following: targetUserId }
        });

        // Add to target user's followers
        await User.findByIdAndUpdate(targetUserId, {
            $push: { followers: currentUserId }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("FOLLOW_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = new mongoose.Types.ObjectId(session.user.id);
        const targetUserId = new mongoose.Types.ObjectId(userId);

        // Remove from current user's following
        await User.findByIdAndUpdate(currentUserId, {
            $pull: { following: targetUserId }
        });

        // Remove from target user's followers
        await User.findByIdAndUpdate(targetUserId, {
            $pull: { followers: currentUserId }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("UNFOLLOW_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
