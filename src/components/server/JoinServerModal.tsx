"use client";

import { useState } from "react";
import { X, Link as LinkIcon, ArrowRight } from "lucide-react";

interface JoinServerModalProps {
    onClose: () => void;
    onJoined: (serverId: string) => void;
}

export default function JoinServerModal({ onClose, onJoined }: JoinServerModalProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleJoin = async () => {
        if (!code) return;
        setLoading(true);
        setError("");

        try {
            // Support full URLs by extracting the last part
            const cleanCode = code.split('/').pop() || code;

            const res = await fetch("/api/invites/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: cleanCode })
            });

            const data = await res.json();

            if (res.ok || data.alreadyMember) {
                if (data.alreadyMember) {
                    // alert("You are already a member of this server.");
                }
                onJoined(data.serverId);
            } else {
                setError(data.message || "Failed to join server");
            }
        } catch (error) {
            console.error(error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <LinkIcon size={20} className="text-green-500" />
                        Join a Server
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium uppercase text-muted-foreground">Invite Code or Link</label>
                        <input
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                setError("");
                            }}
                            placeholder="e.g. 8a342409-..."
                            className={`w-full bg-secondary/50 border rounded-md px-3 py-2 outline-none focus:ring-1 transition-all font-mono text-sm ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-border focus:border-green-500 focus:ring-green-500/50'}`}
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{error}</p>}
                        <p className="text-xs text-muted-foreground">
                            Enter the invite code shared with you.
                        </p>
                    </div>

                    <div className="bg-secondary/20 p-4 rounded-lg border border-border/50 text-sm text-muted-foreground">
                        <h4 className="font-medium text-foreground mb-1">Examples:</h4>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>8a342409-e123-4c56...</li>
                            <li>https://connect-uni.com/invite/8a34...</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-sm text-muted-foreground hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleJoin}
                            disabled={!code || loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                        >
                            {loading ? "Joining..." : <>Join Server <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
