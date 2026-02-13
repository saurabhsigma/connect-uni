"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ImageUpload from "@/components/ImageUpload";

export default function CreateEventPage() {
    const router = useRouter();
    const { status } = useSession();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: "",
        eventType: "free" as "free" | "paid",
        ticketPrice: 0,
        maxAttendees: 0,
        category: "other",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (status === "unauthenticated") {
        router.push("/auth/signin");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error("Failed to create event");
            }

            router.push("/events");
            router.refresh();
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="glass-card w-full max-w-2xl p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/events" className="p-2 rounded-full hover:bg-muted transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Host an Event</h1>
                        <p className="text-muted-foreground text-sm">Fill in the details below</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Event Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            placeholder="Tech Meetup 2024"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Time</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Location</label>
                            <input
                                type="text"
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                                placeholder="Block 38, Auditorium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none h-32 resize-none placeholder:text-muted-foreground"
                            placeholder="What's this event about?"
                        />
                    </div>

                    {/* Ticket Settings */}
                    <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-muted/20">
                        <h3 className="font-semibold text-lg">Ticket Settings</h3>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Event Type</label>
                            <select
                                value={formData.eventType}
                                onChange={e => setFormData({ ...formData, eventType: e.target.value as "free" | "paid" })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                            >
                                <option value="free">Free Event</option>
                                <option value="paid">Paid Event</option>
                            </select>
                        </div>

                        {formData.eventType === 'paid' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Ticket Price (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.ticketPrice}
                                    onChange={e => setFormData({ ...formData, ticketPrice: Number(e.target.value) })}
                                    className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                    placeholder="0"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Max Attendees (0 = unlimited)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.maxAttendees}
                                    onChange={e => setFormData({ ...formData, maxAttendees: Number(e.target.value) })}
                                    className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                    placeholder="100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                >
                                    <option value="concert">Concert</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="seminar">Seminar</option>
                                    <option value="sports">Sports</option>
                                    <option value="cultural">Cultural</option>
                                    <option value="food">Food</option>
                                    <option value="tech">Tech</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <ImageUpload
                        value={formData.image}
                        onChange={(url) => setFormData({ ...formData, image: url })}
                        label="Cover Image (Optional)"
                        folder="events"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg"
                    >
                        {loading ? "Creating Event..." : "Create Event"}
                    </button>
                </form>
            </div>
        </div>
    );
}
