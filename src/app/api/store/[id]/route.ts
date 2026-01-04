import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // Validate ID format if needed, but mongoose might throw if invalid
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
        }

        const product = await Product.findById(id)
            .populate('sellerId', 'name email image role')
            .populate({
                path: 'bids.userId',
                model: 'User',
                select: 'name image email'
            });

        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error("Product GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
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

        // Check if user is admin or product seller
        const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
        const isSeller = product.sellerId.toString() === session.user.id;

        if (!isAdmin && !isSeller) {
            return NextResponse.json({ message: "Forbidden: Only admin or seller can edit" }, { status: 403 });
        }

        const { title, description, price, category, image, status } = await req.json();

        if (title) product.title = title;
        if (description) product.description = description;
        if (price) product.price = price;
        if (category) product.category = category;
        if (image !== undefined) product.image = image;
        if (status) product.status = status;

        await product.save();

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error("Product PUT error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
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

        // Check if user is admin or product seller
        const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator';
        const isSeller = product.sellerId.toString() === session.user.id;

        if (!isAdmin && !isSeller) {
            return NextResponse.json({ message: "Forbidden: Only admin or seller can delete" }, { status: 403 });
        }

        await Product.findByIdAndDelete(id);

        return NextResponse.json({ message: "Product deleted" }, { status: 200 });
    } catch (error) {
        console.error("Product DELETE error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
