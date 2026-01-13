export type TagCategory = "Study" | "Food" | "Hangout" | "Crowded" | "Quiet" | "Sports" | "Unsafe" | "Admin";

export interface CategoryConfig {
    name: TagCategory;
    color: string;
    icon: string;
    bgColor: string;
}

export const CATEGORIES: CategoryConfig[] = [
    { name: "Study", color: "#8b5cf6", icon: "📚", bgColor: "bg-purple-500" },
    { name: "Food", color: "#f59e0b", icon: "🍔", bgColor: "bg-amber-500" },
    { name: "Hangout", color: "#10b981", icon: "🎉", bgColor: "bg-emerald-500" },
    { name: "Crowded", color: "#ef4444", icon: "👥", bgColor: "bg-red-500" },
    { name: "Quiet", color: "#3b82f6", icon: "🤫", bgColor: "bg-blue-500" },
    { name: "Sports", color: "#f97316", icon: "⚽", bgColor: "bg-orange-500" },
    { name: "Unsafe", color: "#dc2626", icon: "⚠️", bgColor: "bg-red-600" },
    { name: "Admin", color: "#6366f1", icon: "🏛️", bgColor: "bg-indigo-500" },
];

export interface CampusTag {
    _id: string;
    campusId: string;
    category: TagCategory;
    text: string;
    location: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };
    upvotes: number;
    downvotes: number;
    createdAt: Date;
}

// LPU Campus bounding box (approximate)
export const LPU_BOUNDS = {
    center: [31.2525, 75.7053] as [number, number], // [lat, lng]
    minLat: 31.2400,
    maxLat: 31.2650,
    minLng: 75.6900,
    maxLng: 75.7200,
};
