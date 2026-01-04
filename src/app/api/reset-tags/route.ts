import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import VerifiedTag from '@/models/VerifiedTag';
import UserLocation from '@/models/UserLocation';

export async function GET() {
    try {
        await dbConnect();
        await VerifiedTag.deleteMany({});
        // Optionally clear user locations too for fresh start
        // await UserLocation.deleteMany({}); 

        return NextResponse.json({ success: true, message: 'Cleared all verified tags' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
