"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { QrCode, CheckCircle, XCircle, AlertCircle, ArrowLeft, Users, Ticket } from "lucide-react";
import Link from "next/link";

interface ScanResult {
    success: boolean;
    message: string;
    alreadyScanned?: boolean;
    ticket?: {
        ticketCode: string;
        attendeeInfo: {
            name: string;
            email: string;
        };
        scannedAt?: string;
        paymentStatus: string;
    };
}

export default function ScanTicketPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [event, setEvent] = useState<any>(null);
    const [ticketCode, setTicketCode] = useState("");
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scannedTickets, setScannedTickets] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, scanned: 0, remaining: 0 });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }
        if (params?.id) {
            fetchEvent();
            fetchEventTickets();
        }
    }, [status, params?.id]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${params?.id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
                
                // Check if user is organizer
                if (session?.user?.id !== data.organizerId?._id && session?.user?.role !== 'admin') {
                    alert("You are not authorized to scan tickets for this event");
                    router.push(`/events/${params?.id}`);
                }
            }
        } catch (error) {
            console.error("Error fetching event:", error);
        }
    };

    const fetchEventTickets = async () => {
        try {
            const res = await fetch(`/api/tickets?eventId=${params?.id}&organizer=true`);
            if (res.ok) {
                const tickets = await res.json();
                const scanned = tickets.filter((t: any) => t.status === 'used');
                setScannedTickets(scanned);
                setStats({
                    total: tickets.length,
                    scanned: scanned.length,
                    remaining: tickets.length - scanned.length
                });
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        }
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketCode.trim()) return;

        setScanning(true);
        setScanResult(null);

        try {
            const res = await fetch("/api/tickets/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    ticketCode: ticketCode.trim(),
                    eventId: params?.id 
                }),
            });

            const data = await res.json();
            setScanResult(data);
            
            if (data.success && !data.alreadyScanned) {
                fetchEventTickets(); // Refresh stats
            }

            // Auto-clear after 3 seconds for next scan
            setTimeout(() => {
                setTicketCode("");
                setScanResult(null);
            }, 3000);
        } catch (error) {
            console.error("Scan error:", error);
            setScanResult({
                success: false,
                message: "Failed to scan ticket"
            });
        } finally {
            setScanning(false);
        }
    };

    if (!event) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href={`/events/${params?.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft size={20} /> Back to Event
                </Link>

                <div className="glass-card p-6 rounded-2xl mb-6">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <QrCode className="text-primary" size={32} />
                        Ticket Scanner
                    </h1>
                    <p className="text-muted-foreground">{event.title}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-primary">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Tickets</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-green-500">{stats.scanned}</div>
                        <div className="text-sm text-muted-foreground">Scanned</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-yellow-500">{stats.remaining}</div>
                        <div className="text-sm text-muted-foreground">Remaining</div>
                    </div>
                </div>

                {/* Scanner */}
                <div className="glass-card p-6 rounded-2xl mb-6">
                    <form onSubmit={handleScan} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Enter Ticket Code</label>
                            <input
                                type="text"
                                value={ticketCode}
                                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                                placeholder="TKT-XXXX-XXXX"
                                className="w-full bg-input border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none text-center text-lg font-mono"
                                autoFocus
                                disabled={scanning}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={scanning || !ticketCode.trim()}
                            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <QrCode size={18} />
                            {scanning ? "Scanning..." : "Scan Ticket"}
                        </button>
                    </form>

                    {/* Scan Result */}
                    {scanResult && (
                        <div className={`mt-4 p-4 rounded-lg border ${
                            scanResult.success && !scanResult.alreadyScanned
                                ? "bg-green-500/10 border-green-500/20"
                                : scanResult.alreadyScanned
                                ? "bg-yellow-500/10 border-yellow-500/20"
                                : "bg-red-500/10 border-red-500/20"
                        }`}>
                            <div className="flex items-start gap-3">
                                {scanResult.success && !scanResult.alreadyScanned ? (
                                    <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                                ) : scanResult.alreadyScanned ? (
                                    <AlertCircle className="text-yellow-500 flex-shrink-0" size={24} />
                                ) : (
                                    <XCircle className="text-red-500 flex-shrink-0" size={24} />
                                )}
                                <div className="flex-1">
                                    <p className={`font-semibold mb-1 ${
                                        scanResult.success && !scanResult.alreadyScanned
                                            ? "text-green-600"
                                            : scanResult.alreadyScanned
                                            ? "text-yellow-600"
                                            : "text-red-600"
                                    }`}>
                                        {scanResult.success && !scanResult.alreadyScanned ? "✓ Valid Ticket" : 
                                         scanResult.alreadyScanned ? "⚠ Already Scanned" : "✗ Invalid Ticket"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-2">{scanResult.message}</p>
                                    {scanResult.ticket && (
                                        <div className="text-sm space-y-1">
                                            <p><strong>Name:</strong> {scanResult.ticket.attendeeInfo.name}</p>
                                            <p><strong>Email:</strong> {scanResult.ticket.attendeeInfo.email}</p>
                                            <p><strong>Code:</strong> {scanResult.ticket.ticketCode}</p>
                                            {scanResult.ticket.scannedAt && (
                                                <p className="text-yellow-600"><strong>Previously scanned:</strong> {new Date(scanResult.ticket.scannedAt).toLocaleString()}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recently Scanned */}
                {scannedTickets.length > 0 && (
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-green-500" />
                            Recently Scanned ({scannedTickets.length})
                        </h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {scannedTickets.slice(0, 20).map((ticket) => (
                                <div key={ticket._id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="text-green-500" size={18} />
                                        <div>
                                            <p className="font-medium">{ticket.attendeeInfo.name}</p>
                                            <p className="text-xs text-muted-foreground">{ticket.ticketCode}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right">
                                        {new Date(ticket.scannedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
