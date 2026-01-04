"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ServerPage() {
    const params = useParams();
    const router = useRouter();
    const serverId = params?.serverId as string;
    const [error, setError] = useState(false);

    useEffect(() => {
        const redirect = async () => {
            try {
                const res = await fetch(`/api/servers/${serverId}`);
                if (res.ok) {
                    const data = await res.json();
                    const channels = data.channels || [];
                    // Prefer 'general', else first text channel, else first channel
                    const target = channels.find((c: any) => c.name === "general")
                        || channels.find((c: any) => c.type === 'text')
                        || channels[0];

                    if (target) {
                        router.replace(`/community/${serverId}/${target._id}`);
                    } else {
                        setError(true);
                    }
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            }
        };
        if (serverId) redirect();
    }, [serverId]);

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground bg-background">
                <div>
                    <h2 className="text-xl font-bold mb-2">No Channels Available</h2>
                    <p>Ask an admin to create a channel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground bg-background">
            <div className="animate-pulse">Loading Server...</div>
        </div>
    );
}
