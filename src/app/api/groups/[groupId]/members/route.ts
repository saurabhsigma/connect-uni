import { NextResponse } from "next/server";
import { GroupChat } from "@/models/GroupChat";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { memberIds } = await req.json();
        const groupObjectId = new mongoose.Types.ObjectId(groupId);
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const group = await GroupChat.findById(groupId);
        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Check if user is admin
        const isAdmin = group.admins.includes(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
        }

        const newMemberIds = memberIds.map((id: string) => new mongoose.Types.ObjectId(id));

        await GroupChat.findByIdAndUpdate(groupId, {
            $push: { members: { $each: newMemberIds } }
        });

        const updatedGroup = await GroupChat.findById(groupId)
            .populate('members', 'name username image')
            .populate('createdBy', 'name username image');

        return NextResponse.json(updatedGroup, { status: 200 });
    } catch (error) {
        console.error("ADD_MEMBERS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { memberId } = await req.json();
        const groupObjectId = new mongoose.Types.ObjectId(groupId);
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const group = await GroupChat.findById(groupId);
        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Check if user is admin or removing themselves
        const isAdmin = group.admins.includes(userId);
        if (!isAdmin && userId.toString() !== memberId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await GroupChat.findByIdAndUpdate(groupId, {
            $pull: { members: new mongoose.Types.ObjectId(memberId) }
        });

        const updatedGroup = await GroupChat.findById(groupId)
            .populate('members', 'name username image')
            .populate('createdBy', 'name username image');

        return NextResponse.json(updatedGroup, { status: 200 });
    } catch (error) {
        console.error("REMOVE_MEMBER_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
