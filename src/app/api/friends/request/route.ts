import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetUserId, action } = await req.json();
        const userId = session.user.id;

        if (!targetUserId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (userId === targetUserId) {
            return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
        }

        await dbConnect();

        const currentUser = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "send") {
            // Check if already friends
            if (currentUser.friends.includes(targetUserId)) {
                return NextResponse.json({ error: "Already friends" }, { status: 400 });
            }

            // Check if request already exists (sent or received)
            const existingRequest = currentUser.friendRequests.find((r: any) =>
                r.user.toString() === targetUserId
            );

            if (existingRequest) {
                return NextResponse.json({ error: "Request already pending" }, { status: 400 });
            }

            // Add 'sent' to current user, 'received' to target user
            currentUser.friendRequests.push({ user: targetUserId, type: 'sent' });
            targetUser.friendRequests.push({ user: userId, type: 'received' });

            await currentUser.save();
            await targetUser.save();

            return NextResponse.json({ message: "Friend request sent" });
        }

        if (action === "accept") {
            const requestIndex = currentUser.friendRequests.findIndex((r: any) =>
                r.user.toString() === targetUserId && r.type === 'received'
            );

            if (requestIndex === -1) {
                return NextResponse.json({ error: "No pending request found" }, { status: 404 });
            }

            // Add to friends lists
            currentUser.friends.push(targetUserId);
            targetUser.friends.push(userId);

            // Remove requests
            currentUser.friendRequests = currentUser.friendRequests.filter((r: any) => r.user.toString() !== targetUserId);
            targetUser.friendRequests = targetUser.friendRequests.filter((r: any) => r.user.toString() !== userId);

            await currentUser.save();
            await targetUser.save();

            return NextResponse.json({ message: "Friend request accepted" });
        }

        if (action === "reject" || action === "cancel") {
            // Remove requests from both sides
            currentUser.friendRequests = currentUser.friendRequests.filter((r: any) => r.user.toString() !== targetUserId);
            targetUser.friendRequests = targetUser.friendRequests.filter((r: any) => r.user.toString() !== userId);

            await currentUser.save();
            await targetUser.save();

            return NextResponse.json({ message: "Friend request removed" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("FRIEND_REQUEST_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
