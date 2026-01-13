"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Store, ShoppingBag, Star, Globe, Instagram, ArrowLeft, Share2, Copy, Check, Loader2, CreditCard } from "lucide-react";

interface StoreData {
    _id: string;
    storeName: string;
    storeSlug: string;
    description: string;
    logo: string;
    banner: string;
    categories: { name: string; description: string }[];
    socialLinks: {
        instagram?: string;
        website?: string;
    };
    rating: number;
    totalReviews: number;
    ownerId: {
        name: string;
        image?: string;
    };
}

interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    productType: string;
    image?: string;
    images?: string[];
    stock: number;
    tags: string[];
    storeId?: string;
    sellerId?: string;
}

export default function ShopViewPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { data: session } = useSession();
    
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<StoreData | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [copied, setCopied] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderForm, setOrderForm] = useState({
        quantity: 1,
        name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        note: "",
    });

    useEffect(() => {
        if (slug) {
            fetchStore();
        }
    }, [slug]);

    const fetchStore = async () => {
        try {
            const res = await fetch(`/api/stores/${slug}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Store data received:', data);
                setStore(data.store);
                setProducts(data.products || []);
            } else {
                console.error('Failed to fetch store:', res.status);
            }
        } catch (error) {
            console.error("Error fetching store:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyStoreLink = () => {
        const link = `${window.location.origin}/shop/${slug}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredProducts = selectedCategory === "All" 
        ? products 
        : products.filter(p => p.category === selectedCategory);

    const openOrderModal = (product: Product) => {
        setSelectedProduct(product);
    };

    const closeOrderModal = () => {
        setSelectedProduct(null);
        setOrderForm({
            quantity: 1,
            name: "",
            phone: "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
            note: "",
        });
    };

    const placeOrder = async () => {
        if (!selectedProduct) return;
        if (session?.user?.id === selectedProduct.sellerId) {
            alert("You cannot order your own product.");
            closeOrderModal();
            return;
        }
        if (!orderForm.name || !orderForm.phone || !orderForm.line1 || !orderForm.city || !orderForm.state || !orderForm.postalCode) {
            alert("Please fill all required address fields.");
            return;
        }
        setPlacingOrder(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct._id,
                    quantity: orderForm.quantity,
                    paymentMethod: "COD",
                    address: {
                        name: orderForm.name,
                        phone: orderForm.phone,
                        line1: orderForm.line1,
                        line2: orderForm.line2,
                        city: orderForm.city,
                        state: orderForm.state,
                        postalCode: orderForm.postalCode,
                    },
                    note: orderForm.note,
                }),
            });

            if (res.ok) {
                alert("Order placed! Seller will contact you for COD.");
                closeOrderModal();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to place order");
            }
        } catch (error) {
            console.error("Order error", error);
            alert("Failed to place order");
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Loading store...</div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
                    <p className="text-muted-foreground mb-4">This store doesn't exist or has been removed.</p>
                    <Link href="/store" className="text-primary hover:underline">
                        Back to Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Banner */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 overflow-hidden">
                {store.banner ? (
                    <img src={store.banner} alt="Store banner" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
                {/* Store Header */}
                <div className="glass-card p-6 rounded-2xl mb-8 border border-border/50">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                            {store.logo ? (
                                <img src={store.logo} alt={store.storeName} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <Store size={40} className="text-white" />
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{store.storeName}</h1>
                                <button
                                    onClick={copyStoreLink}
                                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    title="Copy store link"
                                >
                                    {copied ? <Check size={18} /> : <Share2 size={18} />}
                                </button>
                            </div>
                            <p className="text-muted-foreground mb-3">{store.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                {store.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star size={16} className="text-yellow-500" fill="currentColor" />
                                        <span className="font-semibold">{store.rating.toFixed(1)}</span>
                                        <span className="text-muted-foreground">({store.totalReviews} reviews)</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    by {store.ownerId.name}
                                </div>
                            </div>

                            {(store.socialLinks.instagram || store.socialLinks.website) && (
                                <div className="flex gap-3 mt-3">
                                    {store.socialLinks.instagram && (
                                        <a 
                                            href={store.socialLinks.instagram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 transition-colors"
                                        >
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                    {store.socialLinks.website && (
                                        <a 
                                            href={store.socialLinks.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                        >
                                            <Globe size={18} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        <Link 
                            href="/store"
                            className="px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2 transition-colors"
                        >
                            <ArrowLeft size={18} /> Back
                        </Link>
                    </div>
                </div>

                {/* Category Filter */}
                {store.categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory("All")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                selectedCategory === "All"
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-background/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            All Products
                        </button>
                        {store.categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    selectedCategory === cat.name
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "bg-background/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Products Grid */}
                <div className="pb-12">
                    <h2 className="text-2xl font-bold mb-6">Products & Services ({filteredProducts.length})</h2>
                    
                    {filteredProducts.length === 0 ? (
                        <div className="glass-card p-12 rounded-2xl text-center border border-dashed border-border/50">
                            <ShoppingBag size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No products in this category yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-transform border border-border/50 hover:border-primary/30"
                                >
                                    <div className="h-48 bg-muted/50 relative overflow-hidden flex items-center justify-center">
                                        {product.image || product.images?.[0] ? (
                                            <img 
                                                src={product.image || product.images?.[0]} 
                                                alt={product.title} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                                        )}
                                        <div className="absolute top-2 right-2 px-3 py-1.5 bg-black/70 backdrop-blur rounded-lg text-sm text-white font-semibold shadow-lg">
                                            ₹{product.price}
                                        </div>
                                        {product.productType !== "Physical Product" && (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/90 backdrop-blur rounded text-xs text-white font-medium">
                                                {product.productType}
                                            </div>
                                        )}
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <h3 className="font-semibold line-clamp-1 text-lg">{product.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                                        
                                        {product.tags && product.tags.length > 0 && (
                                            <div className="flex gap-1 flex-wrap pt-2">
                                                {product.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-2 flex items-center justify-between border-t border-border/50">
                                            <span className="text-xs text-muted-foreground">
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{product.category}</span>
                                        </div>
                                        <div className="pt-3 flex gap-2">
                                            {session?.user?.id === product.sellerId ? (
                                                <button
                                                    disabled
                                                    className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-semibold cursor-not-allowed"
                                                    title="You cannot order your own product"
                                                >
                                                    Your Product
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={product.stock === 0}
                                                    onClick={() => openOrderModal(product)}
                                                    className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Cash on Delivery
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-background w-full max-w-lg rounded-2xl border border-border/60 shadow-2xl animate-in fade-in zoom-in-90">
                        <div className="p-5 border-b border-border/60 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Ordering</p>
                                <h3 className="text-xl font-bold">{selectedProduct.title}</h3>
                                <p className="text-sm text-muted-foreground">₹{selectedProduct.price} • {selectedProduct.category}</p>
                            </div>
                            <button onClick={closeOrderModal} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">Quantity</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={orderForm.quantity}
                                        onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">Name*</span>
                                    <input
                                        value={orderForm.name}
                                        onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">Phone*</span>
                                    <input
                                        value={orderForm.phone}
                                        onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                            </div>

                            <div className="space-y-1 text-sm">
                                <span className="text-muted-foreground">Address Line 1*</span>
                                <input
                                    value={orderForm.line1}
                                    onChange={(e) => setOrderForm({ ...orderForm, line1: e.target.value })}
                                    className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1 text-sm">
                                <span className="text-muted-foreground">Address Line 2</span>
                                <input
                                    value={orderForm.line2}
                                    onChange={(e) => setOrderForm({ ...orderForm, line2: e.target.value })}
                                    className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">City*</span>
                                    <input
                                        value={orderForm.city}
                                        onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">State*</span>
                                    <input
                                        value={orderForm.state}
                                        onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">Postal Code*</span>
                                    <input
                                        value={orderForm.postalCode}
                                        onChange={(e) => setOrderForm({ ...orderForm, postalCode: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                                <label className="space-y-1 text-sm">
                                    <span className="text-muted-foreground">Note to seller</span>
                                    <input
                                        value={orderForm.note}
                                        onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-input px-3 py-2"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="p-5 border-t border-border/60 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Cash on Delivery • Total ₹{selectedProduct.price * orderForm.quantity}
                            </div>
                            <button
                                onClick={placeOrder}
                                disabled={placingOrder}
                                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {placingOrder ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                Place Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
