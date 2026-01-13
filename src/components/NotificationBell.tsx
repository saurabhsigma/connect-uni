"use client";

import { useEffect, useState } from "react";
import { Bell, Package, ShoppingBag, X } from "lucide-react";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

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

  const totalUnread =
    (notifications?.unreadBuyerCount || 0) + (notifications?.unreadSellerCount || 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-background border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-h-96 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : !notifications ||
              (notifications.buyerOrders.length === 0 &&
                notifications.sellerOrders.length === 0) ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {/* Buyer Orders Section */}
                {notifications.buyerOrders.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Your Orders
                    </p>
                    {notifications.buyerOrders.map((order: any) => (
                      <div
                        key={order._id}
                        className="py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <ShoppingBag size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {order.productId?.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Status: <span className="capitalize">{order.status}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Seller Orders Section */}
                {notifications.sellerOrders.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Orders from Customers
                    </p>
                    {notifications.sellerOrders.map((order: any) => (
                      <div
                        key={order._id}
                        className="py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <Package size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {order.productId?.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              From: {order.buyerId?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border/60 bg-muted/30">
            <a
              href="/orders"
              className="block text-center text-sm text-primary hover:underline font-medium"
              onClick={() => setOpen(false)}
            >
              View All Orders
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
