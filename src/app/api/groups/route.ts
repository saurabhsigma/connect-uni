import { NextResponse } from "next/server";
import { GroupChat } from "@/models/GroupChat";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, image, memberIds } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Group name is required" }, { status: 400 });
        }

        const groupChat = new GroupChat({
            name,
            description,
            image,
            createdBy: session.user.id,
            members: [session.user.id, ...memberIds],
            admins: [session.user.id],
        });

        await groupChat.save();
        await groupChat.populate('members', 'name username image');
        await groupChat.populate('createdBy', 'name username image');

        return NextResponse.json(groupChat, { status: 201 });
    } catch (error) {
        console.error("CREATE_GROUP_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = new mongoose.Types.ObjectId(session.user.id);

        const groups = await GroupChat.find({
            members: userId
        })
            .populate('members', 'name username image')
            .populate('createdBy', 'name username image')
            .sort({ updatedAt: -1 })
            .exec();

        return NextResponse.json(groups, { status: 200 });
    } catch (error) {
        console.error("GET_GROUPS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
