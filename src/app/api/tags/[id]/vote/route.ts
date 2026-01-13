import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CampusTag from "@/models/CampusTag";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;
        const { vote } = await req.json();

        if (!vote || (vote !== "up" && vote !== "down")) {
            return NextResponse.json({ message: "Invalid vote. Must be 'up' or 'down'" }, { status: 400 });
        }

        const updateField = vote === "up" ? "upvotes" : "downvotes";
        
        const tag = await CampusTag.findByIdAndUpdate(
            id,
            { $inc: { [updateField]: 1 } },
            { new: true }
        );

        if (!tag) {
            return NextResponse.json({ message: "Tag not found" }, { status: 404 });
        }

        return NextResponse.json(tag, { status: 200 });
    } catch (error) {
        console.error("Vote PATCH error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
