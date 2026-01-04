import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('authorId', 'name image')
            .populate('comments.authorId', 'name image');

        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error("Community GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { content, category } = await req.json();

        if (!content) {
            return NextResponse.json({ message: "Content is required" }, { status: 400 });
        }

        await dbConnect();

        const post = await Post.create({
            authorId: session.user.id,
            content,
            category: category || 'General',
        });

        // Populate immediately for UI
        await post.populate('authorId', 'name image');

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("Community POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
