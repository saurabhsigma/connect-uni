import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Await the params object in Next.js 16
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
        }

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        // Toggle RSVP
        if (event.attendees.includes(session.user.id)) {
            event.attendees.pull(session.user.id);
        } else {
            event.attendees.push(session.user.id);
        }

        await event.save();

        return NextResponse.json({ attendees: event.attendees }, { status: 200 });
    } catch (error) {
        console.error("RSVP error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
