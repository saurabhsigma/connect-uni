import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ServerBan } from "@/models/ServerBan";
import { ServerMembers } from "@/models/ServerMembers";
import { Server } from "@/models/Server";

export async function DELETE(req: Request, props: { params: Promise<{ serverId: string, userId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId, userId } = params;
        await dbConnect();

        // Check Permissions
        const requester = await ServerMembers.findOne({ serverId, userId: session.user.id }).populate("roles");
        const server = await Server.findById(serverId);

        let isAdmin = false;
        if (requester) {
            isAdmin = requester.roles.some((r: any) => r.name === 'Admin');
        }
        const isOwner = server?.ownerId.toString() === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ message: "Access Denied" }, { status: 403 });
        }

        await ServerBan.findOneAndDelete({ serverId, userId });

        return NextResponse.json({ message: "Unbanned successfully" });

    } catch (error) {
        console.error("BANS_DELETE", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
