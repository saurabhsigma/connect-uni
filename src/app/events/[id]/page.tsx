"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Edit, Trash2, Share2, User, Ticket, QrCode, IndianRupee, CheckCircle } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image?: string;
    eventType?: 'free' | 'paid';
    ticketPrice?: number;
    maxAttendees?: number;
    registeredCount?: number;
    category?: string;
    organizerId: {
        _id: string;
        name: string;
        image?: string;
        role: string;
    };
    attendees: Array<{
        _id: string;
        name: string;
        image?: string;
    }>;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [purchasingTicket, setPurchasingTicket] = useState(false);
    const [userTicket, setUserTicket] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: "",
    });

    useEffect(() => {
        if (params?.id) {
            fetchEvent();
            if (session?.user?.id) {
                checkUserTicket();
            }
        }
    }, [params?.id, session]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${params?.id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    date: data.date ? new Date(data.date).toISOString().split('T')[0] : "",
                    time: data.time || "",
                    location: data.location || "",
                    image: data.image || "",
                });
            } else {
                router.push('/events');
            }
        } catch (error) {
            console.error("Error fetching event:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkUserTicket = async () => {
        try {
            const res = await fetch(`/api/tickets?eventId=${params?.id}`);
            if (res.ok) {
                const tickets = await res.json();
                if (tickets.length > 0) {
                    setUserTicket(tickets[0]);
                }
            }
        } catch (error) {
            console.error("Error checking ticket:", error);
        }
    };

    const handleGetTicket = async () => {
        if (!session || !event) return;

        setPurchasingTicket(true);
        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: event._id }),
            });

            if (res.ok) {
                const ticket = await res.json();
                setUserTicket(ticket);
                fetchEvent(); // Refresh to update registered count
                alert("Ticket generated successfully! Check My Tickets page.");
            } else {
                const error = await res.json();
                alert(error.message || "Failed to get ticket");
            }
        } catch (error) {
            console.error("Ticket purchase error:", error);
            alert("Failed to get ticket");
        } finally {
            setPurchasingTicket(false);
        }
    };

    const handleRSVP = async () => {
        if (!session || !event) return;

        try {
            await fetch(`/api/events/${event._id}/rsvp`, { method: "POST" });
            fetchEvent(); // Refresh event data
        } catch (error) {
            console.error("RSVP error:", error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        try {
            const res = await fetch(`/api/events/${event._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsEditing(false);
                fetchEvent();
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const handleDelete = async () => {
        if (!event || !confirm("Are you sure you want to delete this event?")) return;

        try {
            const res = await fetch(`/api/events/${event._id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push('/events');
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Event link copied to clipboard!");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!event) {
        return <div className="min-h-screen flex items-center justify-center">Event not found</div>;
    }

    const isAttending = session && event.attendees.some(a => a._id === session.user.id);
    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
    const isOrganizer = session?.user?.id === event.organizerId?._id;
    const canEdit = isAdmin || isOrganizer;
    const isSoldOut = event.maxAttendees && event.registeredCount && event.registeredCount >= event.maxAttendees;
    const hasTicket = !!userTicket;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <Link href="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={20} /> Back to Events
                </Link>

                {/* Hero Image */}
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="relative h-80 bg-muted/50">
                        {event.image ? (
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <Calendar size={80} className="opacity-20" />
                            </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={handleShare}
                                className="p-3 bg-background/80 backdrop-blur rounded-full hover:bg-background transition-colors"
                            >
                                <Share2 size={20} />
                            </button>
                            {canEdit && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="p-3 bg-background/80 backdrop-blur rounded-full hover:bg-background transition-colors"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-3 bg-red-500/80 backdrop-blur rounded-full hover:bg-red-500 transition-colors text-white"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Event Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Time</label>
                                        <input
                                            type="time"
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none h-32 resize-none"
                                        required
                                    />
                                </div>

                                <ImageUpload
                                    value={formData.image}
                                    onChange={(url) => setFormData({ ...formData, image: url })}
                                    label="Cover Image"
                                    folder="events"
                                />

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

                                <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                                    <span className="flex items-center gap-2">
                                        <Calendar size={18} className="text-primary" />
                                        {new Date(event.date).toLocaleDateString('en-US', { 
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock size={18} className="text-secondary" />
                                        {event.time}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <MapPin size={18} className="text-accent" />
                                        {event.location}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Users size={18} className="text-green-400" />
                                        {event.attendees.length} attending
                                    </span>
                                </div>

                                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Organized by</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <User size={16} />
                                        {event.organizerId?.name || 'Unknown Organizer'}
                                        {event.organizerId?.role === 'admin' && 
                                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">Admin</span>
                                        }
                                    </p>
                                </div>

                                <div className="prose prose-invert max-w-none mb-8">
                                    <h2 className="text-xl font-semibold mb-3">About this event</h2>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                                </div>

                                {/* Ticket Info Card */}
                                <div className="mb-6 p-6 glass-card rounded-xl border border-border/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Ticket className="text-primary" size={20} />
                                            Ticket Information
                                        </h3>
                                        {event.eventType === 'paid' && (
                                            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                                <IndianRupee size={20} />
                                                {event.ticketPrice}
                                            </div>
                                        )}
                                        {event.eventType === 'free' && (
                                            <span className="px-4 py-1 bg-green-500/10 text-green-500 rounded-full font-semibold">FREE</span>
                                        )}
                                    </div>

                                    {event.maxAttendees && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-muted-foreground">Tickets Claimed</span>
                                                <span className="font-semibold">
                                                    {event.registeredCount || 0} / {event.maxAttendees}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-primary h-full transition-all"
                                                    style={{ width: `${((event.registeredCount || 0) / event.maxAttendees) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {hasTicket ? (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <div className="flex items-center gap-3 mb-3">
                                                <CheckCircle className="text-green-500" size={24} />
                                                <div>
                                                    <p className="font-semibold text-green-600">You have a ticket!</p>
                                                    <p className="text-sm text-muted-foreground">Ticket Code: {userTicket.ticketCode}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    href="/tickets"
                                                    className="flex-1 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors text-center"
                                                >
                                                    View My Tickets
                                                </Link>
                                                {isOrganizer && (
                                                    <Link
                                                        href={`/events/${event._id}/scan`}
                                                        className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors text-center flex items-center justify-center gap-2"
                                                    >
                                                        <QrCode size={16} />
                                                        Scan Tickets
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleGetTicket}
                                            disabled={!session || purchasingTicket || isSoldOut}
                                            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                                                isSoldOut
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                    : !session
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                    : "bg-primary text-white hover:bg-primary/90 shadow-lg"
                                            }`}
                                        >
                                            <Ticket size={18} />
                                            {!session
                                                ? "Sign in to Get Ticket"
                                                : purchasingTicket
                                                ? "Generating Ticket..."
                                                : isSoldOut
                                                ? "Sold Out"
                                                : event.eventType === 'paid'
                                                ? `Get Ticket - ₹${event.ticketPrice}`
                                                : "Get Free Ticket"}
                                        </button>
                                    )}

                                    {isOrganizer && !hasTicket && (
                                        <Link
                                            href={`/events/${event._id}/scan`}
                                            className="mt-3 w-full py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center font-medium flex items-center justify-center gap-2"
                                        >
                                            <QrCode size={16} />
                                            Scan Tickets (Organizer)
                                        </Link>
                                    )}
                                </div>

                                <button
                                    onClick={handleRSVP}
                                    disabled={!session}
                                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                        isAttending
                                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                                    } ${!session && "opacity-50 cursor-not-allowed"}`}
                                >
                                    {!session ? "Sign in to RSVP" : isAttending ? "Cancel RSVP" : "RSVP Now"}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Attendees - Admin Only */}
                {isAdmin && event.attendees.length > 0 && (
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-green-400" />
                            Attendees ({event.attendees.length})
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">Admin View</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {event.attendees.map(attendee => (
                                <div key={attendee._id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                                        {attendee.name.charAt(0)}
                                    </div>
                                    <span className="text-sm truncate">{attendee.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
