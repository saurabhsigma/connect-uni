import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Location from "@/models/Location";

export async function GET(req: Request) {
    try {
        await dbConnect();
        const locations = await Location.find().sort({ name: 1 });
        return NextResponse.json(locations, { status: 200 });
    } catch (error) {
        console.error("Hoodmaps GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name, type, description } = await req.json();

        if (!name || !type) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const location = await Location.create({
            name,
            type,
            description,
            addedBy: session.user.id,
        });

        return NextResponse.json(location, { status: 201 });
    } catch (error) {
        console.error("Hoodmaps POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
