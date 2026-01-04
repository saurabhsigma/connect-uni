import { NextResponse } from "next/server";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);

        const user = await User.findById(userId)
            .select('-password -blockedUsers')
            .populate('followers', 'name username image')
            .populate('following', 'name username image')
            .exec();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Hide full profile if not following and not self
        if (session?.user?.id !== userId) {
            const currentUser = await User.findById(session?.user?.id);
            const isFollowing = currentUser?.following?.includes(new mongoose.Types.ObjectId(userId));

            if (!isFollowing && user.role !== 'admin') {
                // Show limited profile
                return NextResponse.json({
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    image: user.image,
                    status: user.status,
                    followers: user.followers?.length || 0,
                    followersCount: user.followers?.length || 0,
                }, { status: 200 });
            }
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("GET_PROFILE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const data = await req.json();
        const allowedFields = ['name', 'username', 'bio', 'image', 'interests', 'courses', 'socialLinks'];
        
        const updateData: any = {};
        allowedFields.forEach(field => {
            if (field in data) {
                updateData[field] = data[field];
            }
        });

        const user = await User.findByIdAndUpdate(session.user.id, updateData, { new: true });

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("UPDATE_PROFILE_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
