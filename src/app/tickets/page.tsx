"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon, Calendar, MapPin, Clock, Download, QrCode, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Ticket {
    _id: string;
    ticketCode: string;
    qrCode: string;
    status: 'valid' | 'used' | 'cancelled';
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentAmount: number;
    scannedAt?: string;
    purchasedAt: string;
    eventId: {
        _id: string;
        title: string;
        date: string;
        time: string;
        location: string;
        image?: string;
        eventType: 'free' | 'paid';
    };
}

export default function MyTicketsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }
        if (status === "authenticated") {
            fetchTickets();
        }
    }, [status]);

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/tickets");
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadTicket = (ticket: Ticket) => {
        const link = document.createElement('a');
        link.href = ticket.qrCode;
        link.download = `ticket-${ticket.ticketCode}.png`;
        link.click();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valid':
                return <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-semibold"><CheckCircle size={14} /> Valid</span>;
            case 'used':
                return <span className="flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-xs font-semibold"><CheckCircle size={14} /> Used</span>;
            case 'cancelled':
                return <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-semibold"><XCircle size={14} /> Cancelled</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Loading your tickets...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <TicketIcon className="text-primary" size={40} />
                        My Tickets
                    </h1>
                    <p className="text-muted-foreground">View and manage your event tickets</p>
                </div>

                {tickets.length === 0 ? (
                    <div className="glass-card p-12 rounded-2xl text-center border border-dashed border-border/50">
                        <TicketIcon size={64} className="mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
                        <p className="text-muted-foreground mb-6">Register for events to get your tickets here</p>
                        <Link href="/events" className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tickets.map((ticket) => (
                            <div key={ticket._id} className="glass-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all">
                                {/* Event Image */}
                                <div className="h-40 bg-muted relative overflow-hidden">
                                    {ticket.eventId.image ? (
                                        <img src={ticket.eventId.image} alt={ticket.eventId.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                            <Calendar size={48} className="text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                    {ticket.eventId.eventType === 'paid' && (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500 text-black rounded-md text-xs font-bold">
                                            ₹{ticket.paymentAmount}
                                        </div>
                                    )}
                                </div>

                                {/* Ticket Info */}
                                <div className="p-5 space-y-3">
                                    <h3 className="font-bold text-lg line-clamp-2">{ticket.eventId.title}</h3>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar size={14} className="text-primary" />
                                            <span>{new Date(ticket.eventId.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock size={14} className="text-blue-500" />
                                            <span>{ticket.eventId.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin size={14} className="text-pink-500" />
                                            <span className="line-clamp-1">{ticket.eventId.location}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border/50">
                                        <div className="text-xs text-muted-foreground mb-2">Ticket Code</div>
                                        <div className="font-mono text-sm font-semibold">{ticket.ticketCode}</div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="flex-1 py-2 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <QrCode size={16} />
                                            View QR
                                        </button>
                                        <button
                                            onClick={() => downloadTicket(ticket)}
                                            className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
                    <div className="bg-background w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Event Ticket</h3>
                            <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        {selectedTicket.status === 'used' && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
                                <div className="text-sm">
                                    <p className="font-semibold text-yellow-600 mb-1">Ticket Already Used</p>
                                    <p className="text-muted-foreground">Scanned on {new Date(selectedTicket.scannedAt!).toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-muted/30 rounded-xl p-4 text-center">
                            <img src={selectedTicket.qrCode} alt="QR Code" className="w-64 h-64 mx-auto" />
                        </div>

                        <div className="space-y-2">
                            <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-1">Ticket Code</div>
                                <div className="font-mono text-lg font-bold">{selectedTicket.ticketCode}</div>
                            </div>
                            
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold mb-2">{selectedTicket.eventId.title}</h4>
                                <div className="text-sm space-y-1 text-muted-foreground">
                                    <p>{new Date(selectedTicket.eventId.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    <p>{selectedTicket.eventId.time} • {selectedTicket.eventId.location}</p>
                                </div>
                            </div>

                            <div className="text-center text-xs text-muted-foreground">
                                Present this QR code at the event entrance
                            </div>
                        </div>

                        <button
                            onClick={() => downloadTicket(selectedTicket)}
                            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Download Ticket
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
