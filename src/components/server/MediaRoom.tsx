"use strict";
"use client";

import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface MediaRoomProps {
    channelId: string;
    video: boolean;
    audio: boolean;
}

export default function MediaRoom({
    channelId,
    video,
    audio,
}: MediaRoomProps) {
    const { data: session } = useSession();
    const [token, setToken] = useState("");

    useEffect(() => {
        if (!session?.user?.name) return;

        (async () => {
            try {
                const name = session.user?.name || "Anonymous";
                const resp = await fetch(
                    `/api/livekit/token?room=${channelId}&username=${name}`
                );
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [channelId, session?.user?.name]);

    if (token === "") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            data-lk-theme="default"
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            video={video}
            audio={audio}
        >
            <VideoConference />
        </LiveKitRoom>
    );
}
