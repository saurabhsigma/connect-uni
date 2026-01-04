import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserLocation from '@/models/UserLocation';

export async function GET() {
    try {
        await dbConnect();

        // Fetch user locations from the last hour for real-time heatmap.
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const locations = await UserLocation.find(
            { createdAt: { $gte: oneHourAgo } },
            { 'location.coordinates': 1, _id: 0 }
        ).lean();

        const data = locations.map((loc) => ({
            lat: loc.location.coordinates[1],
            lng: loc.location.coordinates[0],
        }));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching heatmap data:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
