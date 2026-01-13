"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ImageUpload from "@/components/ImageUpload";

export default function AddProductPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [store, setStore] = useState<any>(null);
    const [checkingStore, setCheckingStore] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
        productType: "Physical",
        image: "",
        tags: "",
        stock: "1",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.user?.id) {
            fetchStore();
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
        } finally {
            setCheckingStore(false);
        }
    };

    if (status === "unauthenticated") {
        router.push("/auth/signin");
        return null;
    }

    if (checkingStore) {
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
                    <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Store Required</h2>
                    <p className="text-muted-foreground mb-6">
                        You need to set up your store before adding products.
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            
            const res = await fetch("/api/store", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    tags: tagsArray,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock),
                    storeId: store._id,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create product");
            }

            router.push(`/shop/${store.storeSlug}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="glass-card w-full max-w-2xl p-6 md:p-8 rounded-2xl border border-border/50">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/shop/${store.storeSlug}`} className="p-2 rounded-full hover:bg-muted transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Add Product / Service</h1>
                        <p className="text-muted-foreground text-sm">Fill in the details below</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Product Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                                placeholder="Calculus Textbook"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Price (₹) *</label>
                            <input
                                type="number"
                                required
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                                placeholder="500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Product Type *</label>
                            <select
                                value={formData.productType}
                                onChange={e => setFormData({ ...formData, productType: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                            >
                                <option value="Physical">Physical Product</option>
                                <option value="Digital">Digital Product</option>
                                <option value="Service">Service</option>
                                <option value="Rental">Rental</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Stock Quantity *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Category *</label>
                        <select
                            required
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                        >
                            <option value="">Select a category</option>
                            {store.categories.length > 0 ? (
                                store.categories.map((cat: any) => (
                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                ))
                            ) : (
                                <>
                                    <option>Textbooks</option>
                                    <option>Electronics</option>
                                    <option>Furniture</option>
                                    <option>Clothing</option>
                                    <option>Stationery</option>
                                    <option>Services</option>
                                    <option>Other</option>
                                </>
                            )}
                        </select>
                        {store.categories.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Add custom categories in <Link href="/store/my-store" className="text-primary underline">your store settings</Link>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description *</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none h-32 resize-none placeholder:text-muted-foreground"
                            placeholder="Condition, details, specifications..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            placeholder="new, bestseller, trending"
                        />
                    </div>

                    <ImageUpload
                        value={formData.image}
                        onChange={(url) => setFormData({ ...formData, image: url })}
                        label="Product Image (Optional)"
                        folder="store-products"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Adding Product..." : "Add Product"}
                    </button>
                </form>
            </div>
        </div>
    );
}
