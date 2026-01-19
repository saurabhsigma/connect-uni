"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Store, ShoppingBag, Star, Globe, Instagram, ArrowLeft, Share2, Copy, Check, Loader2, CreditCard, Search, SlidersHorizontal, ChevronDown, Heart, Eye, TrendingUp, Package, Truck } from "lucide-react";

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
    offerPrice?: number;
    category: string;
    productType: string;
    image?: string;
    images?: string[];
    stock: number;
    tags: string[];
    storeId?: string;
    sellerId?: string;
    createdAt?: string;
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
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("featured");
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [showFilters, setShowFilters] = useState(false);
    const [wishlist, setWishlist] = useState<string[]>([]);
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

    const filteredProducts = products
        .filter(p => {
            // Category filter
            if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
            // Search filter
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
                !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            // Price filter
            const productPrice = p.offerPrice || p.price;
            if (productPrice < priceRange.min || productPrice > priceRange.max) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price-low":
                    return (a.offerPrice || a.price) - (b.offerPrice || b.price);
                case "price-high":
                    return (b.offerPrice || b.price) - (a.offerPrice || a.price);
                case "newest":
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                case "popular":
                    return b.stock - a.stock; // Mock popularity by stock
                default:
                    return 0; // featured
            }
        });

    const toggleWishlist = (productId: string) => {
        setWishlist(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const calculateDiscount = (price: number, offerPrice?: number) => {
        if (!offerPrice || offerPrice >= price) return 0;
        return Math.round(((price - offerPrice) / price) * 100);
    };

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

                {/* Search and Filter Bar */}
                <div className="glass-card p-4 rounded-xl mb-6 border border-border/50">
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary cursor-pointer"
                            >
                                <option value="featured">Featured</option>
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="popular">Most Popular</option>
                            </select>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                                    showFilters 
                                        ? "bg-primary/20 text-primary border-primary/30" 
                                        : "bg-input border-border hover:bg-muted"
                                }`}
                            >
                                <SlidersHorizontal size={18} />
                                Filters
                            </button>
                        </div>
                    </div>

                    {/* Price Range Filter */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <h4 className="text-sm font-semibold mb-3">Price Range</h4>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                                    className="w-24 px-3 py-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                />
                                <span className="text-muted-foreground">—</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                                    className="w-24 px-3 py-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                />
                                <button
                                    onClick={() => setPriceRange({ min: 0, max: 100000 })}
                                    className="px-3 py-2 text-sm text-primary hover:underline"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-muted-foreground">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
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
                            {filteredProducts.map((product) => {
                                const discount = calculateDiscount(product.price, product.offerPrice);
                                const finalPrice = product.offerPrice || product.price;
                                return (
                                <div
                                    key={product._id}
                                    onClick={() => setDetailProduct(product)}
                                    className="glass-card rounded-xl overflow-hidden hover:shadow-2xl transition-all border border-border/50 hover:border-primary/30 group cursor-pointer"
                                >
                                    <div className="h-56 bg-muted/50 relative overflow-hidden flex items-center justify-center">
                                        {product.image || product.images?.[0] ? (
                                            <img 
                                                src={product.image || product.images?.[0]} 
                                                alt={product.title} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                            />
                                        ) : (
                                            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                                        )}
                                        
                                        {/* Discount Badge */}
                                        {discount > 0 && (
                                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-white rounded-md text-xs font-bold shadow-lg">
                                                {discount}% OFF
                                            </div>
                                        )}
                                        
                                        {/* Product Type Badge */}
                                        {product.productType !== "Physical" && (
                                            <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500/90 backdrop-blur rounded text-xs text-white font-medium flex items-center gap-1">
                                                <Package size={12} />
                                                {product.productType}
                                            </div>
                                        )}
                                        
                                        {/* Stock Overlay */}
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">Out of Stock</span>
                                            </div>
                                        )}
                                        
                                        {/* Quick Action Buttons */}
                                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product._id);
                                                }}
                                                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                                                    wishlist.includes(product._id)
                                                        ? "bg-red-500 text-white"
                                                        : "bg-white/90 text-gray-800 hover:bg-red-500 hover:text-white"
                                                }`}
                                                title="Add to wishlist"
                                            >
                                                <Heart size={16} fill={wishlist.includes(product._id) ? "currentColor" : "none"} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailProduct(product);
                                                }}
                                                className="p-2 rounded-full bg-white/90 text-gray-800 hover:bg-primary hover:text-white backdrop-blur-sm transition-colors"
                                                title="Quick view"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <h3 className="font-semibold line-clamp-2 text-base hover:text-primary transition-colors">
                                            {product.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
                                        
                                        {/* Price Section */}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-primary">₹{finalPrice}</span>
                                            {product.offerPrice && (
                                                <span className="text-sm text-muted-foreground line-through">₹{product.price}</span>
                                            )}
                                        </div>
                                        
                                        {/* Tags */}
                                        {product.tags && product.tags.length > 0 && (
                                            <div className="flex gap-1.5 flex-wrap">
                                                {product.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stock and Category Info */}
                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                                            <div className="flex items-center gap-1.5">
                                                <Truck size={14} className="text-green-500" />
                                                <span className={product.stock > 0 ? "text-green-600 font-medium" : "text-red-500"}>
                                                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                                                </span>
                                            </div>
                                            <span className="text-muted-foreground">{product.category}</span>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="pt-2 flex gap-2">
                                            {session?.user?.id === product.sellerId ? (
                                                <button
                                                    disabled
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 py-2.5 rounded-lg bg-muted text-muted-foreground text-sm font-semibold cursor-not-allowed"
                                                    title="You cannot order your own product"
                                                >
                                                    Your Product
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={product.stock === 0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openOrderModal(product);
                                                    }}
                                                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <ShoppingBag size={16} />
                                                    Order Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Detail Modal */}
            {detailProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailProduct(null)}>
                    <div className="bg-background w-full max-w-4xl rounded-2xl border border-border/60 shadow-2xl animate-in fade-in zoom-in-90 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm p-5 border-b border-border/60 flex items-center justify-between z-10">
                            <h3 className="text-2xl font-bold">Product Details</h3>
                            <button onClick={() => setDetailProduct(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-8">
                            {/* Product Images */}
                            <div>
                                <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                                    {detailProduct.image || detailProduct.images?.[0] ? (
                                        <img 
                                            src={detailProduct.image || detailProduct.images?.[0]} 
                                            alt={detailProduct.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag size={64} className="text-muted-foreground/30" />
                                        </div>
                                    )}
                                    {calculateDiscount(detailProduct.price, detailProduct.offerPrice) > 0 && (
                                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white rounded-md font-bold">
                                            {calculateDiscount(detailProduct.price, detailProduct.offerPrice)}% OFF
                                        </div>
                                    )}
                                </div>
                                {/* Thumbnail Gallery */}
                                {detailProduct.images && detailProduct.images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2 mt-4">
                                        {detailProduct.images.slice(0, 4).map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                                <img src={img} alt={`${detailProduct.title} ${idx + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <h2 className="text-2xl font-bold">{detailProduct.title}</h2>
                                        <button
                                            onClick={() => toggleWishlist(detailProduct._id)}
                                            className={`p-2 rounded-full transition-colors ${
                                                wishlist.includes(detailProduct._id)
                                                    ? "bg-red-500 text-white"
                                                    : "bg-muted hover:bg-red-500/10 hover:text-red-500"
                                            }`}
                                        >
                                            <Heart size={20} fill={wishlist.includes(detailProduct._id) ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">{detailProduct.category}</span>
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded font-medium">{detailProduct.productType}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/50 rounded-xl">
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-3xl font-bold text-primary">₹{detailProduct.offerPrice || detailProduct.price}</span>
                                        {detailProduct.offerPrice && (
                                            <>
                                                <span className="text-lg text-muted-foreground line-through">₹{detailProduct.price}</span>
                                                <span className="text-sm font-semibold text-green-600">
                                                    Save ₹{detailProduct.price - detailProduct.offerPrice}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Truck size={16} className="text-green-500" />
                                        <span className={detailProduct.stock > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                            {detailProduct.stock > 0 ? `In Stock (${detailProduct.stock} available)` : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className="text-muted-foreground leading-relaxed">{detailProduct.description}</p>
                                </div>

                                {detailProduct.tags && detailProduct.tags.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Tags</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {detailProduct.tags.map((tag, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-border/50">
                                    {session?.user?.id === detailProduct.sellerId ? (
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-lg bg-muted text-muted-foreground font-semibold cursor-not-allowed"
                                        >
                                            Your Product
                                        </button>
                                    ) : (
                                        <button
                                            disabled={detailProduct.stock === 0}
                                            onClick={() => {
                                                setDetailProduct(null);
                                                openOrderModal(detailProduct);
                                            }}
                                            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag size={20} />
                                            Place Order - Cash on Delivery
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
