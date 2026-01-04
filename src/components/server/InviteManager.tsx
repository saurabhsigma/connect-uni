"use client";

import { useState, useEffect } from "react";
import { Link2, Clock, Copy, Plus } from "lucide-react";

export default function InviteManager({ serverId }: { serverId: string }) {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvites();
    }, [serverId]);

    const fetchInvites = async () => {
        try {
            const res = await fetch(`/api/servers/${serverId}/invites`);
            if (res.ok) {
                const data = await res.json();
                setInvites(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const createInvite = async () => {
        try {
            const res = await fetch(`/api/servers/${serverId}/invites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maxUses: 0, expiresInSeconds: 86400 * 7 }), // Default 7 days
            });
            if (res.ok) fetchInvites();
        } catch (error) {
            console.error(error);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert("Invite code copied!");
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Invites</h3>
                <button onClick={createInvite} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/90">
                    <Plus size={14} /> Create New
                </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {invites.length === 0 && <div className="text-muted-foreground text-sm text-center py-4">No active invites.</div>}
                
                {invites.map(invite => (
                    <div key={invite._id} className="flex items-center justify-between p-2 bg-secondary/5 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-background flex items-center justify-center border border-border text-muted-foreground">
                                <Link2 size={16} />
                            </div>
                            <div>
                                <div className="font-mono text-sm font-bold tracking-wider">{invite.code}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>Uses: {invite.uses}/{invite.maxUses || "∞"}</span>
                                    {invite.expiresAt && (
                                        <span className="flex items-center gap-0.5"><Clock size={10} /> {new Date(invite.expiresAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={() => copyCode(invite.code)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded" title="Copy Code">
                            <Copy size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
