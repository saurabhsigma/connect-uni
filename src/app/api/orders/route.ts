import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Store from "@/models/Store";

// GET /api/orders?role=owner
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');

        if (role === 'owner') {
            const store = await Store.findOne({ ownerId: session.user.id }).select('_id');
            if (!store) {
                return NextResponse.json([], { status: 200 });
            }
            const orders = await Order.find({ storeId: store._id })
                .sort({ createdAt: -1 })
                .populate('buyerId', 'name email image');
            return NextResponse.json(orders, { status: 200 });
        }

        // default: buyer orders
        const orders = await Order.find({ buyerId: session.user.id })
            .sort({ createdAt: -1 })
            .populate('productId', 'title');
        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error("Orders GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// POST /api/orders
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { productId, quantity = 1, paymentMethod = 'COD', address, note } = body;

        if (!productId || !address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.state || !address?.postalCode) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const product = await Product.findById(productId).select('title price storeId');
        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        if (paymentMethod !== 'COD') {
            return NextResponse.json({ message: "Only Cash on Delivery supported" }, { status: 400 });
        }

        const order = await Order.create({
            buyerId: session.user.id,
            storeId: product.storeId,
            productId,
            productTitle: product.title,
            productPrice: product.price,
            quantity,
            paymentMethod,
            address,
            note: note || '',
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Orders POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
