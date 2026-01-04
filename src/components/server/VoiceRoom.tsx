"use client";

import { useMemo, useState, useEffect } from "react";
import AgoraRTC, {
    AgoraRTCProvider,
    useJoin,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteUsers,
    useRemoteAudioTracks,
    useIsConnected
} from "agora-rtc-react";
import { Mic, MicOff, PhoneOff, User } from "lucide-react";

import { AGORA_APP_ID } from "@/lib/agoraConfig";

export default function VoiceRoom({ channelId }: { channelId: string }) {
    // Create client instance memoized
    const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white">
            <AgoraRTCProvider client={client}>
                <VoiceControlPanel channelId={channelId} />
            </AgoraRTCProvider>
        </div>
    );
}

function VoiceControlPanel({ channelId }: { channelId: string }) {
    const isConnected = useIsConnected();
    const [micOn, setMicOn] = useState(true);

    // Join Hook
    // In production, token should be fetched from backend. For dev, null uses AppID only mode.
    useJoin({ appid: AGORA_APP_ID, channel: channelId, token: null }, true);

    // Mic Hook
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

    // Publish Hook
    usePublish([localMicrophoneTrack]);

    // Remote Users
    const remoteUsers = useRemoteUsers();
    // Filter out users who don't have audio to prevent "not in channel" subscription errors
    const audioUsers = remoteUsers.filter(user => user.hasAudio);
    const { audioTracks } = useRemoteAudioTracks(audioUsers);

    // Auto-play remote audio
    useEffect(() => {
        audioTracks.map(track => track.play());
        return () => {
            audioTracks.map(track => track.stop());
        };
    }, [audioTracks]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
            <div className="text-2xl font-bold mb-4">Voice Channel: {channelId.slice(-4)}</div>

            {/* Grid of Users */}
            <div className="flex flex-wrap gap-6 justify-center">
                {/* Local User */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center border-4 border-slate-800 shadow-xl relative">
                        <User size={40} />
                        {!micOn && (
                            <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1 border-2 border-slate-900">
                                <MicOff size={14} />
                            </div>
                        )}
                    </div>
                    <span className="font-semibold">You</span>
                </div>

                {/* Remote Users */}
                {remoteUsers.map(user => (
                    <div key={user.uid} className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-800 shadow-xl">
                            <User size={40} />
                        </div>
                        <span className="font-semibold">{user.uid}</span>
                    </div>
                ))}
            </div>

            {/* Status */}
            <div className="mt-8 text-slate-400">
                {isConnected ? "Connected" : "Connecting..."}
            </div>

            {/* Controls Bar */}
            <div className="fixed bottom-8 flex items-center gap-4 bg-slate-900 p-4 rounded-full shadow-2xl border border-slate-800">
                <button
                    onClick={() => setMicOn(!micOn)}
                    className={`p-4 rounded-full transition-colors ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                    {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                {/* Leave Button - ideally navigates away or disconnects */}
                <button
                    onClick={() => window.history.back()}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
}
