"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, ShoppingBag, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      case "accepted":
        return "bg-blue-500/10 text-blue-600";
      case "shipped":
        return "bg-purple-500/10 text-purple-600";
      case "delivered":
        return "bg-green-500/10 text-green-600";
      case "cancelled":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "accepted":
      case "shipped":
        return <Package size={16} />;
      case "delivered":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <AlertCircle size={16} />;
      default:
        return <ShoppingBag size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track your purchases and sales</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border/60">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "purchases"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              My Purchases ({notifications?.buyerOrders?.length || 0})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "sales"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              Sales ({notifications?.sellerOrders?.length || 0})
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === "purchases" && (
          <div className="space-y-4">
            {!notifications?.buyerOrders || notifications.buyerOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start shopping from our stores to track your orders here.
                </p>
                <Link
                  href="/shop"
                  className="inline-block px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Browse Stores
                </Link>
              </div>
            ) : (
              notifications.buyerOrders.map((order: any) => (
                <div
                  key={order._id}
                  className="bg-card border border-border/60 rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Product</p>
                      <p className="font-semibold">{order.productId?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{order.productPrice} x {order.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Store</p>
                      <p className="font-semibold">{order.storeId?.storeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.paymentMethod === "COD" ? "Cash on Delivery" : "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Delivery Address</p>
                      <p className="text-sm">
                        {order.address?.line1}, {order.address?.city} {order.address?.postalCode}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "sales" && (
          <div className="space-y-4">
            {!notifications?.sellerOrders || notifications.sellerOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
                <p className="text-muted-foreground mb-6">
                  Orders from customers will appear here once they start buying from your store.
                </p>
                <Link
                  href="/store/my-store"
                  className="inline-block px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Manage Store
                </Link>
              </div>
            ) : (
              notifications.sellerOrders.map((order: any) => (
                <div
                  key={order._id}
                  className="bg-card border border-border/60 rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Product</p>
                      <p className="font-semibold">{order.productId?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{order.productPrice} x {order.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Customer</p>
                      <p className="font-semibold">{order.buyerId?.name}</p>
                      <p className="text-sm text-muted-foreground">{order.buyerId?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Delivery Address</p>
                      <p className="text-sm">
                        {order.address?.line1}, {order.address?.city} {order.address?.postalCode}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
