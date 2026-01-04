import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserLocation from '@/models/UserLocation';
import VerifiedTag from '@/models/VerifiedTag';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { lat, lng, placeName, tagType, tagText } = body;

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
        }

        await dbConnect();

        // 1. Save User Location (Submission)
        console.log(`Saving user location for user ${session.user.id} at lat: ${lat}, lng: ${lng}, tagType: ${tagType}, tagText: ${tagText}`);
        const userLocation = await UserLocation.create({
            userId: new mongoose.Types.ObjectId(session.user.id),
            location: {
                type: 'Point',
                coordinates: [lng, lat],
            },
            // Optional: keep placeName for backward compat or specialized usage
            placeName: placeName || undefined,
            tagType: tagType || undefined,
            tagText: tagText || undefined,
        });
        console.log('User location saved successfully');

        // 2. Verification Logic (Dynamic Vibe Tags)
        if (tagType && tagText) {
            const RADIUS_METERS = 50;
            // DEV MODE: 1 user verification
            const MIN_UNIQUE_USERS = 1;

            // Find similar vibe submissions nearby (same type, similar text?)
            // For simplicity: match exact type and normalized text
            const normalizedText = tagText.trim().toLowerCase();

            const nearbySubmissions = await UserLocation.find({
                tagType: tagType,
                tagText: new RegExp(`^${normalizedText}$`, 'i'), // Case insensitive match
                location: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [lng, lat] },
                        $maxDistance: RADIUS_METERS,
                    },
                },
            });

            const uniqueUsers = new Set(nearbySubmissions.map((sub) => sub.userId.toString()));
            console.log(`Nearby submissions for tagType ${tagType}, text ${normalizedText}: ${nearbySubmissions.length}`);
            console.log(`Unique users: ${uniqueUsers.size}`);

            if (uniqueUsers.size >= MIN_UNIQUE_USERS) {
                console.log('Threshold met, processing tag');
                // Upsert Verified Tag
                // Check if a VerifiedTag exists nearby with same type/text
                const existingTag = await VerifiedTag.findOne({
                    tagType: tagType,
                    tagText: new RegExp(`^${normalizedText}$`, 'i'),
                    location: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: [lng, lat] },
                            $maxDistance: RADIUS_METERS,
                        },
                    },
                });

                if (existingTag) {
                    console.log('Updating existing tag');
                    existingTag.count = uniqueUsers.size;
                    existingTag.lastActive = new Date();
                    await existingTag.save();
                } else {
                    console.log('Creating new tag');
                    await VerifiedTag.create({
                        tagText: tagText.trim(), // Use original casing for display
                        tagType: tagType,
                        location: {
                            type: 'Point',
                            coordinates: [lng, lat],
                        },
                        count: uniqueUsers.size,
                    });
                }
            }
        }

        return NextResponse.json({ success: true, data: userLocation }, { status: 201 });
    } catch (error: any) {
        console.error('Error submitting location:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
