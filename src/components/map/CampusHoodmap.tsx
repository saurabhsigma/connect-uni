"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { CampusTag, CATEGORIES, LPU_BOUNDS, TagCategory } from "@/lib/campusConfig";
import { ThumbsUp, ThumbsDown, MapPin, Loader } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSession } from "next-auth/react";

interface UserLocation {
    userId: string;
    lat: number;
    lng: number;
}

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number; // 0-1
}

export function CampusHoodmap() {
    const [tags, setTags] = useState<CampusTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<TagCategory | null>(null);
    const [addingTag, setAddingTag] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
    const [tagText, setTagText] = useState("");
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<UserLocation[]>([]);
    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
    const mapRef = useRef<L.Map>(null);
    const { socket } = useSocket();
    const { data: session } = useSession();
    const heatmapLayerRef = useRef<L.Layer | null>(null);

    useEffect(() => {
        fetchTags();
        getUserLocation();
    }, []);

    const getUserLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    setLocationLoading(false);
                    
                    // Send user location to server for heatmap
                    if (session?.user?.id) {
                        sendLocationToServer(latitude, longitude);
                    }
                },
                (error) => {
                    console.warn("Geolocation error:", error);
                    // Set default LPU center if geolocation fails
                    setUserLocation([LPU_BOUNDS.center[0], LPU_BOUNDS.center[1]]);
                    setLocationLoading(false);
                }
            );
        } else {
            setUserLocation([LPU_BOUNDS.center[0], LPU_BOUNDS.center[1]]);
            setLocationLoading(false);
        }
    };

    const sendLocationToServer = async (lat: number, lng: number) => {
        try {
            if (!session?.user?.id) return;
            
            await fetch("/api/user-locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session.user.id,
                    lat,
                    lng,
                }),
            });
        } catch (error) {
            console.error("Error sending location to server:", error);
        }
    };

    // Fetch user locations for heatmap
    useEffect(() => {
        const fetchUserLocations = async () => {
            try {
                const res = await fetch("/api/user-locations");
                if (res.ok) {
                    const data = await res.json();
                    // Convert API format to local format
                    const locations: UserLocation[] = data.map((loc: any) => ({
                        userId: loc.userId,
                        lat: loc.location.coordinates[1],
                        lng: loc.location.coordinates[0],
                    }));
                    setOnlineUsers(locations);
                    generateHeatmapData(locations);
                }
            } catch (error) {
                console.error("Error fetching user locations:", error);
            }
        };

        // Fetch immediately and then every 10 seconds
        fetchUserLocations();
        const interval = setInterval(fetchUserLocations, 10000);

        return () => clearInterval(interval);
    }, []);

    const generateHeatmapData = (userLocations: UserLocation[]) => {
        if (userLocations.length === 0) {
            setHeatmapData([]);
            return;
        }

        // Create grid-based heatmap with adaptive grid size
        const gridSize = 0.0015; // ~160m cells (adjusted for better density visualization)
        const density = new Map<string, { count: number; lats: number[]; lngs: number[] }>();

        // Count users in each grid cell
        userLocations.forEach(user => {
            const gridX = Math.floor(user.lat / gridSize);
            const gridY = Math.floor(user.lng / gridSize);
            const gridKey = `${gridX},${gridY}`;
            
            if (!density.has(gridKey)) {
                density.set(gridKey, { count: 0, lats: [], lngs: [] });
            }
            
            const cell = density.get(gridKey)!;
            cell.count += 1;
            cell.lats.push(user.lat);
            cell.lngs.push(user.lng);
        });

        // Find max density for normalization
        const maxDensity = Math.max(...Array.from(density.values()).map(v => v.count));

        // Convert grid to heatmap points with averaged center
        const points: HeatmapPoint[] = Array.from(density.entries())
            .filter(([_, cell]) => cell.count > 0)
            .map(([key, cell]) => {
                const avgLat = cell.lats.reduce((a, b) => a + b, 0) / cell.lats.length;
                const avgLng = cell.lngs.reduce((a, b) => a + b, 0) / cell.lngs.length;
                
                return {
                    lat: avgLat,
                    lng: avgLng,
                    intensity: Math.min(1, cell.count / Math.max(1, maxDensity * 0.5)), // Scale to 0-1
                };
            });

        setHeatmapData(points);
    };


    const fetchTags = async () => {
        try {
            const res = await fetch("/api/tags?campusId=lpu");
            if (res.ok) {
                const data = await res.json();
                setTags(data);
            }
        } catch (error) {
            console.error("Error fetching tags:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mapRef.current) return;
        
        const map = mapRef.current;
        const handleMapClick = (e: any) => {
            if (addingTag) {
                const { lat, lng } = e.latlng;
                setSelectedLocation([lat, lng]);
            }
        };

        map.on("click", handleMapClick);
        return () => {
            map.off("click", handleMapClick);
        };
    }, [addingTag]);

    const handleAddTag = async () => {
        if (!selectedLocation || !selectedCategory) return;

        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campusId: "lpu",
                    category: selectedCategory,
                    text: tagText,
                    lat: selectedLocation[0],
                    lng: selectedLocation[1],
                }),
            });

            if (res.ok) {
                setAddingTag(false);
                setSelectedLocation(null);
                setTagText("");
                setSelectedCategory(null);
                fetchTags();
            }
        } catch (error) {
            console.error("Error adding tag:", error);
        }
    };

    const handleVote = async (tagId: string, voteType: "up" | "down") => {
        try {
            const res = await fetch(`/api/tags/${tagId}/vote`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vote: voteType }),
            });

            if (res.ok) {
                fetchTags();
            }
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    const getCategoryColor = (category: TagCategory) => {
        const cat = CATEGORIES.find(c => c.name === category);
        return cat?.color || "#6366f1";
    };

    const getCategoryIcon = (category: TagCategory) => {
        const cat = CATEGORIES.find(c => c.name === category);
        return cat?.icon || "📍";
    };

    const getHeatmapColor = (intensity: number): string => {
        // Red for high density (>0.7), yellow for medium (0.4-0.7), green for low (<0.4)
        if (intensity > 0.7) return "#ef4444"; // Red
        if (intensity > 0.4) return "#fbbf24"; // Yellow
        if (intensity > 0) return "#10b981"; // Green
        return "transparent"; // No users
    };

    const getScore = (tag: CampusTag) => tag.upvotes - tag.downvotes;

    const getOpacity = (score: number) => {
        if (score < -3) return 0.3;
        if (score < 0) return 0.6;
        return 1;
    };

    const getRadius = (score: number) => {
        return 5 + Math.max(0, score) * 0.5; // Grows with positive score
    };

    return (
        <div className="w-full h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b border-border bg-background/80 backdrop-blur">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold">Campus Hoodmaps</h1>
                        {userLocation && !locationLoading && (
                            <div className="flex items-center gap-2 text-sm text-green-400">
                                <MapPin size={16} />
                                <span>Location enabled</span>
                            </div>
                        )}
                        {locationLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader size={16} className="animate-spin" />
                                <span>Finding location...</span>
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm">Click on map to add tags, vote on existing ones. See online users heatmap.</p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        <button
                            onClick={() => setAddingTag(!addingTag)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                addingTag
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground hover:bg-muted/80"
                            }`}
                        >
                            {addingTag ? "Cancel" : "Add Tag"}
                        </button>
                    </div>

                    {/* Category Selection */}
                    {addingTag && (
                        <div className="mt-4 p-4 glass-card rounded-lg">
                            <p className="text-sm font-semibold mb-3">Select Category:</p>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`p-2 rounded-lg text-center transition-all ${
                                            selectedCategory === cat.name
                                                ? "bg-primary text-primary-foreground scale-110"
                                                : "bg-muted hover:bg-muted/80"
                                        }`}
                                    >
                                        <div className="text-xl">{cat.icon}</div>
                                        <div className="text-xs mt-1 font-medium">{cat.name}</div>
                                    </button>
                                ))}
                            </div>

                            {selectedLocation && (
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                    <p className="text-sm mb-2">Add optional description (max 120 chars):</p>
                                    <textarea
                                        value={tagText}
                                        onChange={e => setTagText(e.target.value.slice(0, 120))}
                                        placeholder="e.g., Best quiet spot after 8pm"
                                        className="w-full bg-input p-2 rounded border border-border text-foreground outline-none focus:border-primary text-sm h-16 resize-none"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">{tagText.length}/120</div>
                                    <button
                                        onClick={handleAddTag}
                                        className="mt-3 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                                    >
                                        Submit Tag
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading map...</p>
                    </div>
                ) : (
                    <MapContainer
                        center={userLocation || [LPU_BOUNDS.center[0], LPU_BOUNDS.center[1]]}
                        zoom={16}
                        style={{ width: "100%", height: "100%" }}
                        ref={mapRef}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {/* Heatmap Layer - User Density */}
                        {heatmapData.map((point, idx) => (
                            <Circle
                                key={`heatmap-${idx}`}
                                center={[point.lat, point.lng]}
                                radius={250} // Larger radius for better visualization
                                pathOptions={{
                                    color: getHeatmapColor(point.intensity),
                                    fill: true,
                                    fillOpacity: Math.pow(point.intensity, 0.6) * 0.5, // Improved opacity curve
                                    weight: 1,
                                    fillColor: getHeatmapColor(point.intensity),
                                }}
                            />
                        ))}

                        {/* User's current location */}
                        {userLocation && (
                            <Circle
                                center={userLocation}
                                radius={20}
                                pathOptions={{
                                    color: "#3b82f6",
                                    fill: true,
                                    fillOpacity: 0.8,
                                    weight: 2,
                                    dashArray: "5, 5",
                                }}
                            >
                                <Popup>
                                    <div className="p-2 text-sm">
                                        <p className="font-bold">Your Location</p>
                                        <p className="text-xs text-muted-foreground">
                                            {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                                        </p>
                                    </div>
                                </Popup>
                            </Circle>
                        )}

                        {/* Campus boundary (visual reference) */}
                        <Circle
                            center={[LPU_BOUNDS.center[0], LPU_BOUNDS.center[1]]}
                            radius={1500}
                            pathOptions={{
                                color: "rgba(99, 102, 241, 0.2)",
                                fill: false,
                                weight: 2,
                                dashArray: "5, 5",
                            }}
                        />

                        {/* Tags */}
                        {tags.map(tag => {
                            const [lng, lat] = tag.location.coordinates;
                            const score = getScore(tag);
                            const categoryIcon = getCategoryIcon(tag.category);

                            return (
                                <Circle
                                    key={tag._id}
                                    center={[lat, lng]}
                                    radius={getRadius(score)}
                                    pathOptions={{
                                        color: getCategoryColor(tag.category),
                                        fill: true,
                                        fillOpacity: getOpacity(score),
                                        weight: 2,
                                    }}
                                >
                                    <Popup>
                                        <div className="p-3 text-sm w-60">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">{categoryIcon}</span>
                                                <span className="font-bold">{tag.category}</span>
                                            </div>
                                            {tag.text && (
                                                <p className="text-muted-foreground mb-3 text-xs">{tag.text}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVote(tag._id, "up")}
                                                    className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium"
                                                >
                                                    <ThumbsUp size={14} />
                                                    {tag.upvotes}
                                                </button>
                                                <button
                                                    onClick={() => handleVote(tag._id, "down")}
                                                    className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium"
                                                >
                                                    <ThumbsDown size={14} />
                                                    {tag.downvotes}
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Circle>
                            );
                        })}

                        {/* Selected location marker while adding */}
                        {selectedLocation && addingTag && (
                            <Circle
                                center={selectedLocation}
                                radius={10}
                                pathOptions={{
                                    color: "#fbbf24",
                                    fill: true,
                                    fillOpacity: 0.8,
                                    weight: 2,
                                }}
                            />
                        )}
                    </MapContainer>
                )}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border bg-background/80 backdrop-blur">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categories */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">CATEGORY TAGS</p>
                            <div className="flex flex-wrap gap-3">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.name} className="flex items-center gap-2 text-xs">
                                        <span className="text-lg">{cat.icon}</span>
                                        <span className="text-muted-foreground">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Heatmap Legend */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">USER DENSITY HEATMAP</p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-red-500/60"></div>
                                    <span className="text-xs text-muted-foreground">High Density</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-yellow-500/60"></div>
                                    <span className="text-xs text-muted-foreground">Medium Density</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-green-500/60"></div>
                                    <span className="text-xs text-muted-foreground">Low Density</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-border"></div>
                                    <span className="text-xs text-muted-foreground">Your Location</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
