
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function ServerDiscoveryList() {
    const [servers, setServers] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/servers/public").then(res => res.json()).then(data => {
            if (Array.isArray(data)) setServers(data);
        });
    }, []);

    const handleJoin = async (serverId: string) => {
        try {
            const res = await fetch("/api/servers/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serverId }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/community/${data.serverId}`);
            } else {
                alert("Failed to join");
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (servers.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servers.map(server => (
                <div key={server._id} className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg">
                            {server.icon ? <img src={server.icon} className="w-full h-full rounded-full object-cover"/> : server.name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold">{server.name}</h3>
                            <p className="text-xs text-muted-foreground">{server.description || "A public community"}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleJoin(server._id)}
                        className="px-4 py-2 bg-secondary/20 hover:bg-green-500 hover:text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        Join
                    </button>
                </div>
            ))}
        </div>
    );
}
