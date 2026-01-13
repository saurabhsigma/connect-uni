"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Trash2, X, Plus } from "lucide-react";
import Link from "next/link";

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
  tags?: string[];
  stock: number;
  storeId?: string;
  status: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    offerPrice: "",
    category: "",
    productType: "Physical",
    images: [] as string[],
    imageUrl: "",
    tags: "",
    stock: "1",
  });
  const [error, setError] = useState("");
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    if (productId && session?.user?.id) {
      fetchProduct();
      fetchStore();
    }
  }, [productId, session]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/store/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          offerPrice: data.offerPrice?.toString() || "",
          category: data.category,
          productType: data.productType || "Physical",
          images: data.images || (data.image ? [data.image] : []),
          imageUrl: "",
          tags: data.tags?.join(", ") || "",
          stock: data.stock.toString(),
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
          imageUrl: "",
        }));
      } else {
        setError("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const res = await fetch(`/api/store/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
          category: formData.category,
          productType: formData.productType,
          images: formData.images,
          tags: tagsArray,
          stock: parseInt(formData.stock),
        }),
      });

      if (res.ok) {
        alert("Product updated successfully!");
        router.push(`/shop/${store?.storeSlug}`);
        router.refresh();
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to update product");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/store/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Product deleted successfully!");
        router.push(`/shop/${store?.storeSlug}`);
        router.refresh();
      } else {
        setError("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md border border-border/50">
          <p className="text-muted-foreground mb-6">Product not found</p>
          <Link
            href="/store/my-store"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/shop/${store?.storeSlug}`}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground text-sm">Update product details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
            <h2 className="text-lg font-bold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                placeholder="Product title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground h-32 outline-none focus:border-primary"
                placeholder="Product description"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                  placeholder="Category"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData({ ...formData, productType: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                >
                  <option value="Physical">Physical</option>
                  <option value="Digital">Digital</option>
                  <option value="Service">Service</option>
                  <option value="Rental">Rental</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
            <h2 className="text-lg font-bold">Pricing & Stock</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Offer Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.offerPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, offerPrice: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                  placeholder="Leave empty for no offer"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stock *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                placeholder="1"
                min="0"
                required
              />
            </div>
          </div>

          {/* Images */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
            <h2 className="text-lg font-bold">Images</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Images
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB per image
              </p>
            </div>

            {/* Images Gallery */}
            {formData.images.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Uploaded Images</p>
                <div className="grid grid-cols-3 gap-3">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="glass-card p-6 rounded-2xl space-y-4 border border-border/50">
            <h2 className="text-lg font-bold">Tags & Details</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground outline-none focus:border-primary"
                placeholder="e.g., eco-friendly, handmade, trending"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 rounded-full bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
