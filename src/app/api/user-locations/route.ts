import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserLocation from "@/models/UserLocation";

// GET active user locations for heatmap
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Get users who have pinged in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const locations = await UserLocation.find({
            lastSeen: { $gte: fiveMinutesAgo },
        }).select("location lastSeen -_id");

        return NextResponse.json(locations, { status: 200 });
    } catch (error) {
        console.error("User locations GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// POST/UPDATE user location
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { userId, lat, lng } = await req.json();

        if (!userId || lat === undefined || lng === undefined) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const location = await UserLocation.findOneAndUpdate(
            { userId },
            {
                userId,
                location: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
                lastSeen: new Date(),
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(location, { status: 200 });
    } catch (error) {
        console.error("User locations POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
