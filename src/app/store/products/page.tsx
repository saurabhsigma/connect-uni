"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  offerPrice?: number;
  category: string;
  image?: string;
  images?: string[];
  stock: number;
  storeId?: string;
  createdAt: string;
}

export default function ProductsManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStore();
      fetchProducts();
    }
  }, [session]);

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/stores?userId=${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setStore(data);
      }
    } catch (error) {
      console.error("Error fetching store:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      // Get user's store first
      const storeRes = await fetch(`/api/stores?userId=${session?.user?.id}`);
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData);

        // Get all products and filter by store
        const res = await fetch("/api/store");
        if (res.ok) {
          const allProducts = await res.json();
          // Filter products that belong to this store
          const storeProducts = allProducts.filter(
            (p: Product) => p.storeId === storeData._id
          );
          setProducts(storeProducts);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/store/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p._id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md border border-border/50">
          <p className="text-muted-foreground mb-6">
            You need to create a store first
          </p>
          <Link
            href="/store/my-store"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Create Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Products Management</h1>
            <p className="text-muted-foreground">
              Manage your store products and services
            </p>
          </div>
          <Link
            href="/store/new"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Add Product
          </Link>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center border border-border/50">
            <ShoppingBag size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-6">No products yet</p>
            <Link
              href="/store/new"
              className="inline-block px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="glass-card p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                    {product.image || product.images?.[0] ? (
                      <img
                        src={product.image || product.images?.[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={32} className="text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{product.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {product.description}
                    </p>
                    <div className="flex gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category: </span>
                        <span className="font-medium">{product.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price: </span>
                        <span className="font-medium">₹{product.price}</span>
                        {product.offerPrice && (
                          <span className="text-cyan-400 ml-2">
                            → ₹{product.offerPrice}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock: </span>
                        <span className="font-medium">{product.stock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-center">
                    <Link
                      href={`/store/products/${product._id}/edit`}
                      className="p-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                    >
                      <Edit size={18} /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
