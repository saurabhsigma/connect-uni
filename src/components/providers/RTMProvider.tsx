"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useSession } from "next-auth/react";
// import AgoraRTM from "agora-rtm-sdk"; // Removed static import
import { AGORA_APP_ID } from "@/lib/agoraConfig";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useRouter } from "next/navigation";

const RTMContext = createContext<any>(null);

export const useRTM = () => useContext(RTMContext);

export function RTMProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const router = useRouter();
    const rtmClient = useRef<any>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null); // { channelId, callerName, type: 'audio'|'video' }

    useEffect(() => {
        if (!session?.user?.id) return;

        const init = async () => {
            try {
                // Dynamically import AgoraRTM to avoid SSR "window is not defined" error
                const AgoraRTM = (await import("agora-rtm-sdk")).default;
                const { RTM } = AgoraRTM;

                rtmClient.current = new RTM(AGORA_APP_ID, session.user.id);

                rtmClient.current.addEventListener('message', ({ message }: any) => {
                    try {
                        const text = typeof message === 'string' ? message : JSON.stringify(message);
                        const data = JSON.parse(text);

                        // Handle Incoming Call
                        if (data.type === 'call_invite') {
                            setIncomingCall({
                                channelId: data.channelId,
                                callerName: data.callerName || "Unknown",
                                callType: data.callType || 'audio',
                                peerId: "peer" // V2 listener might change params, assuming data payload has info
                            });
                            // Play Ringtone
                            const audio = new Audio('/sounds/ring.mp3');
                            audio.loop = true;
                            audio.id = "ringtone";
                            document.body.appendChild(audio);
                            audio.play().catch(e => console.log("Audio play failed (interaction needed)", e));
                        }
                    } catch (e) {
                        console.error("RTM Parse Error", e);
                    }
                });

                await rtmClient.current.login();

            } catch (err) {
                console.error("Global RTM Init Error", err);
            }
        };

        const cleanup = async () => {
            if (rtmClient.current) await rtmClient.current.logout();
        };

        init();
        return () => { cleanup(); };
    }, [session?.user?.id]);

    const acceptCall = () => {
        // Stop Ringtone
        const audio = document.getElementById("ringtone") as HTMLAudioElement;
        if (audio) {
            audio.pause();
            audio.remove();
        }

        if (incomingCall) {
            router.push(`/community/me/${incomingCall.channelId}?autoJoin=true&video=${incomingCall.callType === 'video'}`);
            setIncomingCall(null);
        }
    };

    const declineCall = () => {
        // Stop Ringtone
        const audio = document.getElementById("ringtone") as HTMLAudioElement;
        if (audio) {
            audio.pause();
            audio.remove();
        }
        setIncomingCall(null);
    };

    return (
        <RTMContext.Provider value={{ rtmClient }}>
            {children}

            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-background border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4">
                        <div className="w-24 h-24 rounded-full bg-secondary animate-pulse flex items-center justify-center">
                            {incomingCall.callType === 'video' ? <Video size={40} /> : <Phone size={40} />}
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold">{incomingCall.callerName}</h3>
                            <p className="text-muted-foreground">Incoming {incomingCall.callType} Call...</p>
                        </div>
                        <div className="flex items-center gap-8 w-full justify-center">
                            <button
                                onClick={declineCall}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-transform hover:scale-110"
                            >
                                <PhoneOff size={28} />
                            </button>
                            <button
                                onClick={acceptCall}
                                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-transform hover:scale-110 animate-bounce"
                            >
                                <Phone size={28} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </RTMContext.Provider>
    );
}
