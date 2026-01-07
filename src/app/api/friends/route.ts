import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const currentUser = await User.findById(session.user.id)
            .populate('friends', 'name username image status')
            .populate({
                path: 'friendRequests.user',
                select: 'name username image'
            });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Separate requests into incoming and outgoing
        const incoming = currentUser.friendRequests
            .filter((r: any) => r.type === 'received')
            .map((r: any) => ({
                user: r.user,
                createdAt: r.createdAt
            }));

        const outgoing = currentUser.friendRequests
            .filter((r: any) => r.type === 'sent')
            .map((r: any) => ({
                user: r.user,
                createdAt: r.createdAt
            }));

        return NextResponse.json({
            friends: currentUser.friends,
            requests: {
                incoming,
                outgoing
            }
        });

    } catch (error) {
        console.error("GET_FRIENDS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
