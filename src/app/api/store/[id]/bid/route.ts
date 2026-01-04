import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        if (product.status === 'sold') {
            return NextResponse.json({ message: "Product is already sold" }, { status: 400 });
        }

        const { amount, message } = await req.json();

        if (!amount) {
            return NextResponse.json({ message: "Bid amount is required" }, { status: 400 });
        }

        // Add bid
        product.bids.push({
            userId: session.user.id,
            amount,
            message: message || "",
            createdAt: new Date(),
        });

        // Update status to in-bid if not already
        if (product.status === 'available') {
            product.status = 'in-bid';
        }

        await product.save();

        // Return populated product with bid details
        const populatedProduct = await Product.findById(product._id)
            .populate('sellerId', 'name email image role')
            .populate({
                path: 'bids.userId',
                model: 'User',
                select: 'name image email'
            });

        return NextResponse.json({ message: "Bid placed successfully", product: populatedProduct }, { status: 200 });
    } catch (error) {
        console.error("Bid POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
