"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image?: string;
    organizerId: {
        name: string;
        image?: string;
    };
    attendees: string[];
}

export default function EventsPage() {
    const { data: session } = useSession();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async (eventId: string) => {
        if (!session) return;

        // Optimistic update
        setEvents(events.map(e => {
            if (e._id === eventId) {
                const isAttending = e.attendees.includes(session.user.id);
                return {
                    ...e,
                    attendees: isAttending
                        ? e.attendees.filter(id => id !== session.user.id)
                        : [...e.attendees, session.user.id]
                };
            }
            return e;
        }));

        try {
            await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
        } catch (error) {
            console.error("RSVP error:", error);
            // Revert on error would be ideal here
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto">
                {/* Hero Header */}
                <div className="relative px-4 md:px-8 pt-8 pb-12 md:pt-16 md:pb-20 bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 border-b border-border">
                    <div className="flex justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                    <Calendar className="text-white" size={24} />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                                    Campus Events
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-lg max-w-xl">Discover and join exciting events happening around campus. Connect with your community.</p>
                        </div>
                        <Link
                            href="/events/new"
                            className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-300 flex items-center gap-2 whitespace-nowrap hover:-translate-y-1"
                        >
                            <Plus size={20} /> Create Event
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 md:px-8 py-8 md:py-12 space-y-6">

                {loading ? (
                    <div className="text-center py-32">
                        <div className="animate-pulse text-muted-foreground text-lg">Loading events...</div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-32 glass-card rounded-3xl border-2 border-dashed border-border/50">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} className="text-orange-400/50" />
                        </div>
                        <p className="text-foreground font-semibold text-lg mb-2">No upcoming events</p>
                        <p className="text-muted-foreground mb-6">Be the first to create an event and bring people together!</p>
                        <Link href="/events/new" className="inline-block px-6 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all">Create an Event</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {events.map(event => {
                            const isAttending = session && event.attendees.includes(session.user.id);
                            return (
                                <Link 
                                    key={event._id} 
                                    href={`/events/${event._id}`}
                                    className="group glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-border/50"
                                >
                                    <div className="md:w-2/5 h-56 md:h-auto relative bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden">
                                        {event.image ? (
                                            <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-red-500/10">
                                                <Calendar size={64} className="opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute top-4 left-4 bg-gradient-to-br from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-center shadow-lg font-semibold">
                                            <p className="text-xs font-bold uppercase tracking-wide">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                            <p className="text-2xl font-bold">{new Date(event.date).getDate()}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-8 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h2 className="text-2xl md:text-3xl font-bold group-hover:text-orange-400 transition-colors flex-1">{event.title}</h2>
                                                {isAttending && <span className="px-4 py-1.5 bg-green-500/15 text-green-400 text-xs font-bold rounded-full border border-green-500/30 whitespace-nowrap ml-2">✓ GOING</span>}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <Clock size={16} className="text-blue-400 flex-shrink-0" />
                                                    <span className="font-medium">{event.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <MapPin size={16} className="text-pink-400 flex-shrink-0" />
                                                    <span className="font-medium line-clamp-1">{event.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <Users size={16} className="text-green-400 flex-shrink-0" />
                                                    <span className="font-medium">{event.attendees.length} going</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors text-xs">
                                                    <span className="w-2 h-2 rounded-full bg-foreground/30" />
                                                    <span className="font-medium truncate">{event.organizerId?.name}</span>
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground line-clamp-2 mb-6 group-hover:text-foreground/80 transition-colors">{event.description}</p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRSVP(event._id);
                                            }}
                                            disabled={!session}
                                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isAttending
                                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                                    : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/40"
                                                } ${!session && "opacity-50 cursor-not-allowed"}`}
                                        >
                                            {isAttending ? "✓ Going" : "RSVP Now"}
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
