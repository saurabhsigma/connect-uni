import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VerifiedPlace from '@/models/VerifiedPlace';

export async function GET() {
    try {
        await dbConnect();

        const places = await VerifiedPlace.find({}).lean();

        const data = places.map((place) => ({
            id: place._id,
            name: place.name,
            lat: place.location.coordinates[1],
            lng: place.location.coordinates[0],
            count: place.count,
        }));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching verified places:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
