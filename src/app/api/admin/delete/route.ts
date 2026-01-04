import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Product from "@/models/Product";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user from database to check role
        await dbConnect();
        const user = await User.findById(session.user?.id);

        // Only admin and moderator can delete
        if (!user || (user.role !== "admin" && user.role !== "moderator")) {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        const { type, id } = await request.json();

        if (!type || !id) {
            return NextResponse.json(
                { error: "Missing type or id" },
                { status: 400 }
            );
        }

        let deleted;
        const validTypes = ["event", "product", "post"];

        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Allowed types: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        switch (type) {
            case "event":
                deleted = await Event.findByIdAndDelete(id);
                if (!deleted) {
                    return NextResponse.json(
                        { error: "Event not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json({
                    success: true,
                    message: `Event "${deleted.title}" has been deleted`,
                    deletedId: id,
                });

            case "product":
                deleted = await Product.findByIdAndDelete(id);
                if (!deleted) {
                    return NextResponse.json(
                        { error: "Product not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json({
                    success: true,
                    message: `Product "${deleted.name}" has been deleted`,
                    deletedId: id,
                });

            case "post":
                deleted = await Post.findByIdAndDelete(id);
                if (!deleted) {
                    return NextResponse.json(
                        { error: "Post not found" },
                        { status: 404 }
                    );
                }
                return NextResponse.json({
                    success: true,
                    message: "Post has been deleted",
                    deletedId: id,
                });

            default:
                return NextResponse.json(
                    { error: "Invalid type" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Admin delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        );
    }
}
