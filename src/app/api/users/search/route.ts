import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        await dbConnect();

        // Search Users (excluding self)
        const users = await User.find({
            _id: { $ne: session.user.id },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        }).select("name email image _id").limit(10);

        return NextResponse.json(users);

    } catch (error) {
        console.error("USER_SEARCH_GET", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
