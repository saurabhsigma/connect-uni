"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Map, Plus, Star, Navigation, Flame } from "lucide-react";

interface Location {
    _id: string;
    name: string;
    type: string;
    description: string;
    rating: number;
}

export default function HoodmapsPage() {
    const { data: session } = useSession();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLocation, setNewLocation] = useState({ name: "", type: "Hostel", description: "" });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await fetch("/api/hoodmaps");
            if (res.ok) {
                const data = await res.json();
                setLocations(data);
            }
        } catch (error) {
            console.error("Error fetching locations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        try {
            const res = await fetch("/api/hoodmaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLocation),
            });

            if (res.ok) {
                setShowAddForm(false);
                setNewLocation({ name: "", type: "Hostel", description: "" });
                fetchLocations();
            }
        } catch (error) {
            console.error("Error adding location:", error);
        }
    };

    const types = ['Hostel', 'Food', 'Study', 'Sports', 'Other'];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center gap-2">
                            <Map className="text-emerald-400" /> Hoodmaps
                        </h1>
                        <p className="text-muted-foreground mt-1">Navigate the campus and find hidden gems.</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/map">
                            <button className="px-6 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/25">
                                <Flame size={18} /> Live Heatmap
                            </button>
                        </Link>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            disabled={!session}
                            className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
                        >
                            <Plus size={18} /> Add Place
                        </button>
                    </div>
                </div>

                {showAddForm && (
                    <div className="glass-card p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-lg font-bold mb-4">Add New Location</h3>
                        <form onSubmit={handleAddLocation} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="Location Name (e.g. Block 38)"
                                    className="bg-input p-3 rounded-lg border border-border text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
                                    value={newLocation.name}
                                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                                    required
                                />
                                <select
                                    className="bg-input p-3 rounded-lg border border-border text-foreground outline-none focus:border-primary"
                                    value={newLocation.type}
                                    onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                                >
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <textarea
                                placeholder="Description (e.g. Best place for quiet study...)"
                                className="w-full bg-input p-3 rounded-lg border border-border text-foreground outline-none focus:border-primary h-24 placeholder:text-muted-foreground"
                                value={newLocation.description}
                                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg hover:bg-muted">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white">Add Location</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.length > 0 ? locations.map(loc => (
                        <div key={loc._id} className="glass-card p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Navigation size={100} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                                ${loc.type === 'Hostel' ? 'bg-blue-500/10 text-blue-500' :
                                            loc.type === 'Food' ? 'bg-orange-500/10 text-orange-500' :
                                                loc.type === 'Study' ? 'bg-purple-500/10 text-purple-500' :
                                                    'bg-gray-500/10 text-gray-500'}`}>
                                        {loc.type}
                                    </span>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-bold">{loc.rating || "-"}</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2">{loc.name}</h3>
                                <p className="text-muted-foreground text-sm line-clamp-3">{loc.description}</p>
                            </div>
                        </div>
                    )) : !loading && (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            No locations added yet. Be the first!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
