"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Plus } from "lucide-react";

interface Product {
    _id: string;
    title: string;
    price: number;
    category: string;
    image?: string;
    sellerId: {
        name: string;
        image?: string;
    };
}

export default function StorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/store");
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "All" || p.category === category;
        return matchesSearch && matchesCategory;
    });

    const categories = ["All", "Textbooks", "Electronics", "Furniture", "Clothing", "Other"];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="relative px-4 md:px-8 pt-8 pb-12 md:pt-16 md:pb-20 bg-gradient-to-br from-blue-500/10 via-background to-cyan-500/10 border-b border-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                                <ShoppingBag className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                Surplus Store
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-xl">Buy and sell quality items with your campus community. Fair prices, trusted peers.</p>
                    </div>
                    <Link
                        href="/store/new"
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2 whitespace-nowrap hover:-translate-y-1"
                    >
                        <Plus size={20} /> Sell Item
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
                {/* Search & Filter */}
                <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row gap-4 border border-border/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-muted-foreground h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground focus:ring-1 focus:ring-primary outline-none placeholder:text-muted-foreground"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${category === cat
                                        ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30"
                                        : "bg-background/50 hover:bg-background/80 border border-border text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center py-32">
                        <div className="animate-pulse text-muted-foreground text-lg">Loading products...</div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-32 glass-card rounded-3xl border-2 border-dashed border-border/50">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag size={32} className="text-blue-400/50" />
                        </div>
                        <p className="text-foreground font-semibold text-lg mb-2">No items found</p>
                        <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
                        <Link href="/store/new" className="inline-block px-6 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all">List an Item</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <Link 
                                key={product._id} 
                                href={`/store/${product._id}`}
                                className="glass-card rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
                            >
                                {/* Image Placeholder */}
                                <div className="h-48 bg-muted/50 relative overflow-hidden flex items-center justify-center">
                                    {product.image ? (
                                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white font-medium">
                                        ₹{product.price}
                                    </div>
                                </div>

                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-foreground line-clamp-1">{product.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{product.category}</p>

                                    <div className="pt-2 flex items-center gap-2 border-t border-border/50">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                            {product.sellerId?.name?.[0] || "?"}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{product.sellerId?.name || "Unknown Seller"}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
