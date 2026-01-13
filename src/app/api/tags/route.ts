import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CampusTag from "@/models/CampusTag";

// GET all tags for a campus
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const campusId = searchParams.get("campusId") || "lpu";

        const tags = await CampusTag.find({ campusId }).sort({ createdAt: -1 });
        
        return NextResponse.json(tags, { status: 200 });
    } catch (error) {
        console.error("Tags GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// POST a new tag
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { campusId = "lpu", category, text, lat, lng } = await req.json();

        if (!category || lat === undefined || lng === undefined) {
            return NextResponse.json({ message: "Missing required fields: category, lat, lng" }, { status: 400 });
        }

        // Validate category
        const validCategories = ["Study", "Food", "Hangout", "Crowded", "Quiet", "Sports", "Unsafe", "Admin"];
        if (!validCategories.includes(category)) {
            return NextResponse.json({ message: "Invalid category" }, { status: 400 });
        }

        // Validate text length
        if (text && text.length > 120) {
            return NextResponse.json({ message: "Text must be 120 characters or less" }, { status: 400 });
        }

        const tag = await CampusTag.create({
            campusId,
            category,
            text: text || "",
            location: {
                type: "Point",
                coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            },
        });

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        console.error("Tags POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
