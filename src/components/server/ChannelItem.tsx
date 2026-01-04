"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Hash, Volume2, Video } from "lucide-react";

export default function ChannelItem({ channel, serverId }: { channel: any, serverId: string }) {
    const params = useParams();
    const isActive = params?.channelId === channel._id;

    return (
        <Link 
            href={`/community/${serverId}/${channel._id}`}
            className={clsx(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
            )}
        >
            {channel.type === 'text' && <Hash size={16} />}
            {channel.type === 'audio' && <Volume2 size={16} />}
            {channel.type === 'video' && <Video size={16} />}
            <span className="truncate">{channel.name}</span>
        </Link>
    );
}