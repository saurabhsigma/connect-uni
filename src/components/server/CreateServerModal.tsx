"use client";

import { useState } from "react";
import { X, Lock, Globe, Shield } from "lucide-react";

interface CreateServerModalProps {
    onClose: () => void;
    onCreated: (server: any) => void;
}

export default function CreateServerModal({ onClose, onCreated }: CreateServerModalProps) {
    const [name, setName] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            const res = await fetch("/api/servers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: "A new community",
                    icon: "",
                    visibility: isPrivate ? "private" : "public"
                })
            });

            if (res.ok) {
                const data = await res.json();
                onCreated(data.server);
            } else {
                alert("Failed to create server");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Shield size={20} className="text-primary" />
                        Create Your Community
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium uppercase text-muted-foreground">Server Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Community"
                            className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">Give your new server a personality with a catchy name.</p>
                    </div>

                    <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 font-medium">
                                {isPrivate ? <Lock size={18} className="text-indigo-400" /> : <Globe size={18} className="text-green-400" />}
                                {isPrivate ? "Private Community" : "Public Community"}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isPrivate
                                ? "Only invited members can join. Not listed in discovery."
                                : "Anyone can discover and join this server."}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-sm text-muted-foreground hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!name || loading}
                            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                        >
                            {loading ? "Creating..." : "Create Server"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
