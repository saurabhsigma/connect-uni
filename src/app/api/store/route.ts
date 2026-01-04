import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User"; // Ensure User is registered

export async function GET(req: Request) {
    try {
        await dbConnect();
        // Fetch all products (not just available) and populate seller details
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .populate('sellerId', 'name image');

        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        console.error("Products GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { title, description, price, category, image } = await req.json();

        if (!title || !description || !price || !category) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const product = await Product.create({
            sellerId: session.user.id,
            title,
            description,
            price,
            category,
            image,
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Products POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
