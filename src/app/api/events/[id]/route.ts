import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const event = await Event.findById(id)
            .populate('organizerId', 'name image role')
            .populate('attendees', 'name image');

        if (!event) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        return NextResponse.json(event, { status: 200 });
    } catch (error) {
        console.error("Event GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        // Check if user is admin or event organizer
        const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
        const isOrganizer = event.organizerId.toString() === session.user.id;

        if (!isAdmin && !isOrganizer) {
            return NextResponse.json({ message: "Forbidden: Only admin or organizer can edit" }, { status: 403 });
        }

        const { title, description, date, time, location, image } = await req.json();

        if (title) event.title = title;
        if (description) event.description = description;
        if (date) event.date = date;
        if (time) event.time = time;
        if (location) event.location = location;
        if (image !== undefined) event.image = image;

        await event.save();

        return NextResponse.json(event, { status: 200 });
    } catch (error) {
        console.error("Event PUT error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        // Check if user is admin or event organizer
        const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
        const isOrganizer = event.organizerId.toString() === session.user.id;

        if (!isAdmin && !isOrganizer) {
            return NextResponse.json({ message: "Forbidden: Only admin or organizer can delete" }, { status: 403 });
        }

        await Event.findByIdAndDelete(id);

        return NextResponse.json({ message: "Event deleted" }, { status: 200 });
    } catch (error) {
        console.error("Event DELETE error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
