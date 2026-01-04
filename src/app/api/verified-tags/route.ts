import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VerifiedTag from '@/models/VerifiedTag';

export async function GET() {
    try {
        await dbConnect();

        // Fetch verified tags
        // Optional: Filter by lastActive (e.g., last 7 days) if strictly following rules.
        // For now, fetch all.
        const tags = await VerifiedTag.find({}).lean();
        console.log(`Fetched ${tags.length} verified tags`);

        const data = tags.map((tag) => ({
            id: tag._id,
            text: tag.tagText,
            type: tag.tagType,
            lat: tag.location.coordinates[1],
            lng: tag.location.coordinates[0],
            count: tag.count,
        }));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching verified tags:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
