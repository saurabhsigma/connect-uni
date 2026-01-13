"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Store, Plus, Edit, Save, Link as LinkIcon, Instagram, Globe, X } from "lucide-react";
import Link from "next/link";

export default function MyStorePage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        storeName: "",
        description: "",
        logo: "",
        banner: "",
        categories: [] as { name: string; description: string }[],
        socialLinks: {
            instagram: "",
            twitter: "",
            website: "",
        },
    });
    const [logoUploading, setLogoUploading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchStore();
        }
    }, [session]);

    useEffect(() => {
        if (store?._id) {
            fetchProducts();
        }
    }, [store?._id]);

    const fetchStore = async () => {
        try {
            const res = await fetch(`/api/stores?userId=${session?.user?.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setStore(data);
                    setFormData({
                        storeName: data.storeName,
                        description: data.description || "",
                        logo: data.logo || "",
                        banner: data.banner || "",
                        categories: data.categories || [],
                        socialLinks: data.socialLinks || { instagram: "", twitter: "", website: "" },
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching store:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        if (!store?._id) return;
        setProductsLoading(true);
        try {
            const res = await fetch(`/api/store?storeId=${store._id}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProducts(data);
                }
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                setStore(data);
                setIsEditing(false);
                alert("Store created successfully!");
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (error) {
            console.error("Error creating store:", error);
            alert("Failed to create store");
        }
    };

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/stores", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    storeId: store._id,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setStore(data);
                setIsEditing(false);
                alert("Store updated successfully!");
            } else {
                const error = await res.json();
                alert(error.error || "Failed to update store");
            }
        } catch (error) {
            console.error("Error updating store:", error);
            alert("Failed to update store");
        }
    };

    const addCategory = () => {
        setFormData({
            ...formData,
            categories: [...formData.categories, { name: "", description: "" }],
        });
    };

    const removeCategory = (index: number) => {
        const newCategories = formData.categories.filter((_, i) => i !== index);
        setFormData({ ...formData, categories: newCategories });
    };

    const updateCategory = (index: number, field: string, value: string) => {
        const newCategories = [...formData.categories];
        newCategories[index] = { ...newCategories[index], [field]: value };
        setFormData({ ...formData, categories: newCategories });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setLogoUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataToSend,
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, logo: data.url }));
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Failed to upload image');
        } finally {
            setLogoUploading(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        
        try {
            const res = await fetch(`/api/store/${productId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setProducts(products.filter(p => p._id !== productId));
                alert("Product deleted successfully");
            } else {
                alert("Failed to delete product");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!store && !isEditing) {
        return (
            <div className="min-h-screen bg-background p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="glass-card p-12 rounded-3xl text-center border border-border/50">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                            <Store size={40} className="text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Create Your Store</h1>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Set up your own storefront to sell products and services to your campus community. 
                            Get a unique store link you can share anywhere!
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">
                        {store ? "Manage Store" : "Create Store"}
                    </h1>
                    {store && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 rounded-lg bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <Edit size={18} /> Edit Store
                        </button>
                    )}
                </div>

                {(isEditing || !store) && (
                    <form onSubmit={store ? handleUpdateStore : handleCreateStore} className="space-y-6">
                        <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
                            <h2 className="text-xl font-bold">Basic Information</h2>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">Store Name *</label>
                                <input
                                    type="text"
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                    placeholder="My Awesome Store"
                                    required
                                    disabled={!!store}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Your store URL: /shop/{formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'your-store'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground h-32 outline-none focus:border-primary"
                                    placeholder="Tell customers about your store..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Logo</label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            disabled={logoUploading}
                                        />
                                        {logoUploading && (
                                            <p className="text-xs text-blue-400">Uploading...</p>
                                        )}
                                        {formData.logo && (
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                                                <img src={formData.logo} alt="Logo preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Banner URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={formData.banner}
                                        onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                        placeholder="https://... (optional)"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Add a banner image to showcase your store</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Product Categories</h2>
                                <button
                                    type="button"
                                    onClick={addCategory}
                                    className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm flex items-center gap-1 hover:bg-primary/30 transition-colors"
                                >
                                    <Plus size={16} /> Add Category
                                </button>
                            </div>
                            
                            {formData.categories.length === 0 && (
                                <p className="text-sm text-muted-foreground">Add custom categories for your products and services</p>
                            )}

                            {formData.categories.map((cat, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        value={cat.name}
                                        onChange={(e) => updateCategory(index, 'name', e.target.value)}
                                        className="flex-1 p-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                        placeholder="Category name (e.g., Tutoring, Graphic Design)"
                                    />
                                    <input
                                        type="text"
                                        value={cat.description}
                                        onChange={(e) => updateCategory(index, 'description', e.target.value)}
                                        className="flex-1 p-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                        placeholder="Description (optional)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCategory(index)}
                                        className="px-3 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
                            <h2 className="text-xl font-bold">Social Links (Optional)</h2>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Instagram size={20} className="text-pink-500" />
                                    <input
                                        type="url"
                                        value={formData.socialLinks.instagram}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                                        })}
                                        className="flex-1 p-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                        placeholder="Instagram URL"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe size={20} className="text-blue-500" />
                                    <input
                                        type="url"
                                        value={formData.socialLinks.website}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            socialLinks: { ...formData.socialLinks, website: e.target.value }
                                        })}
                                        className="flex-1 p-2 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                                        placeholder="Website URL"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end">
                            {store && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-lg bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg"
                            >
                                <Save size={18} /> {store ? "Save Changes" : "Create Store"}
                            </button>
                        </div>
                    </form>
                )}

                {store && !isEditing && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 rounded-2xl border border-border/50">
                            <h3 className="text-lg font-bold mb-4">Store Preview</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Store URL:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="px-3 py-2 bg-muted rounded text-sm flex-1 font-mono">
                                            {typeof window !== 'undefined' ? window.location.origin : ''}/shop/{store.storeSlug}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/shop/${store.storeSlug}`);
                                                alert('Store link copied to clipboard!');
                                            }}
                                            className="px-3 py-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                                            title="Copy link"
                                        >
                                            <LinkIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Total Sales:</span>
                                        <p className="text-2xl font-bold">{store.totalSales || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Rating:</span>
                                        <p className="text-2xl font-bold">{store.rating?.average?.toFixed(1) || "N/A"}</p>
                                    </div>
                                </div>
                                {store.categories.length > 0 && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">Categories:</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {store.categories.map((cat: any, idx: number) => (
                                                <span key={idx} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Link
                                href={`/shop/${store.storeSlug}`}
                                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-center hover:shadow-lg hover:shadow-blue-500/40 transition-all"
                            >
                                View My Store
                            </Link>
                            <Link
                                href="/store/new"
                                className="flex-1 py-3 rounded-lg border-2 border-primary text-primary font-semibold text-center hover:bg-primary/10 transition-all"
                            >
                                Add Products
                            </Link>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-border/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Your Products ({products.length})</h3>
                                <Link
                                    href="/store/new"
                                    className="px-4 py-2 rounded-lg bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors"
                                >
                                    <Plus size={18} /> Add New
                                </Link>
                            </div>

                            {productsLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No products yet. <Link href="/store/new" className="text-primary hover:underline">Create one now!</Link></p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {products.map((product) => (
                                        <div key={product._id} className="border border-border/50 rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
                                            <div className="aspect-square bg-muted overflow-hidden relative group">
                                                {product.images && product.images.length > 0 ? (
                                                    <img 
                                                        src={product.images[0]} 
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <h4 className="font-semibold truncate">{product.name}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-lg font-bold">${product.price}</span>
                                                        {product.offerPrice && (
                                                            <span className="ml-2 text-sm line-through text-muted-foreground">${product.offerPrice}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <Link
                                                        href={`/store/products/${product._id}/edit`}
                                                        className="flex-1 py-2 rounded bg-primary/20 text-primary text-sm font-medium text-center hover:bg-primary/30 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Edit size={14} /> Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product._id)}
                                                        className="flex-1 py-2 rounded bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
