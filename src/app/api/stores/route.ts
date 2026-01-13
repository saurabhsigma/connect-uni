import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Store from '@/models/Store';
import User from '@/models/User';

// GET - Fetch user's store
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const store = await Store.findOne({ ownerId: userId }).populate('ownerId', 'name email image');

    // Return null instead of 404 so the client can gracefully show the "Create store" UI
    return NextResponse.json(store || null, { status: 200 });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

// POST - Create a new store
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { storeName, description, logo, banner, bannerImage, categories, contactEmail, contactPhone, socialLinks } = body;

    if (!storeName || !description) {
      return NextResponse.json(
        { error: 'Store name and description are required' },
        { status: 400 }
      );
    }

    // Check if user already has a store
    const existingStore = await Store.findOne({ ownerId: session.user.id });
    if (existingStore) {
      return NextResponse.json(
        { error: 'You already have a store' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create store
    const store = await Store.create({
      ownerId: session.user.id,
      storeName,
      description,
      logo: logo || '',
      bannerImage: banner || bannerImage || '',
      categories: categories || [],
      contactEmail: contactEmail || user.email,
      contactPhone: contactPhone || '',
      socialLinks: socialLinks || {},
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
}

// PATCH - Update existing store
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { storeId, ...updateData } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID required' },
        { status: 400 }
      );
    }

    // Find store and verify ownership
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    if (store.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update store
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    );
  }
}
