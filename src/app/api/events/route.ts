import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const events = await Event.find()
            .populate('organizerId', 'name image');

        // Sort by number of attendees (descending) and then by date
        const sortedEvents = events.sort((a, b) => {
            const attendeeDiff = b.attendees.length - a.attendees.length;
            if (attendeeDiff !== 0) return attendeeDiff;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        return NextResponse.json(sortedEvents, { status: 200 });
    } catch (error) {
        console.error("Events GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { title, description, date, time, location, image } = await req.json();

        if (!title || !description || !date || !time || !location) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const event = await Event.create({
            organizerId: session.user.id,
            title,
            description,
            date,
            time,
            location,
            image,
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Events POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
