import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Invite } from "@/models/Invite";
import { ServerMembers } from "@/models/ServerMembers";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ message: "Invite code required" }, { status: 400 });
        }

        await dbConnect();

        // Find Invite
        const invite = await Invite.findOne({ code });
        if (!invite) {
            return NextResponse.json({ message: "Invalid invite code" }, { status: 404 });
        }

        // Check Expiry
        if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
            return NextResponse.json({ message: "Invite expired" }, { status: 410 });
        }

        // Check Max Uses
        if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
            return NextResponse.json({ message: "Invite limit reached" }, { status: 410 });
        }

        const serverId = invite.serverId;

        // Check if banned
        const { ServerBan } = await import("@/models/ServerBan");
        const banned = await ServerBan.findOne({ serverId, userId: session.user.id });
        if (banned) {
            return NextResponse.json({ message: "You are banned from this server" }, { status: 403 });
        }

        // Check Membership
        const existing = await ServerMembers.findOne({ userId: session.user.id, serverId });
        if (existing) {
            return NextResponse.json({ message: "Already a member", serverId, alreadyMember: true }, { status: 200 });
        }

        // Create Membership
        await ServerMembers.create({
            userId: session.user.id,
            serverId,
            role: "guest"
        });

        // Increment Uses
        invite.uses += 1;
        await invite.save();

        return NextResponse.json({ success: true, serverId }, { status: 201 });

    } catch (error) {
        console.error("INVITE_JOIN_POST", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
