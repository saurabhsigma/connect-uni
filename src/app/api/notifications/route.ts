import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Store from "@/models/Store";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch orders where user is the buyer
    const buyerOrders = await Order.find({ buyerId: session.user.id })
      .populate("productId", "title price image")
      .populate("storeId", "storeName storeSlug")
      .sort({ createdAt: -1 })
      .limit(20);

    // Fetch orders for stores owned by this user (seller view)
    const userStore = await Store.findOne({ ownerId: session.user.id }).select("_id");
    let sellerOrders = [];
    if (userStore) {
      sellerOrders = await Order.find({ storeId: userStore._id })
        .populate("buyerId", "name email")
        .populate("productId", "title price")
        .sort({ createdAt: -1 })
        .limit(20);
    }

    return NextResponse.json(
      {
        buyerOrders,
        sellerOrders,
        unreadBuyerCount: buyerOrders.filter((o) => !o.buyerNotified).length,
        unreadSellerCount: sellerOrders.filter((o) => !o.sellerNotified).length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
