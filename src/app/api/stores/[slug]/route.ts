import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Store from '@/models/Store';
import Product from '@/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;

    // Find store by slug
    const store = await Store.findOne({ storeSlug: slug }).populate('ownerId', 'name email image');

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Find all products for this store
    const products = await Product.find({ storeId: store._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      store,
      products
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}
