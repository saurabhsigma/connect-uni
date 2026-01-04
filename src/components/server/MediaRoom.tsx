"use client";

import { useMemo, useState, useEffect } from "react";
import AgoraRTC, { 
    AgoraRTCProvider, 
    useJoin, 
    useLocalMicrophoneTrack, 
    useLocalCameraTrack,
    usePublish, 
    useRemoteUsers, 
    useRemoteAudioTracks,
    useRemoteVideoTracks,
    useIsConnected,
    LocalVideoTrack,
    RemoteVideoTrack
} from "agora-rtc-react"; 
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

// In a real app, fetch token from backend
const appId = "e371f60ed7c440c88a6c01f092b4ceea"; 

export default function MediaRoom({ channelId, video = false }: { channelId: string, video?: boolean }) {
    const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white">
            <AgoraRTCProvider client={client}>
                <MediaControlPanel channelId={channelId} initialVideo={video} />
            </AgoraRTCProvider>
        </div>
    );
}

function MediaControlPanel({ channelId, initialVideo }: { channelId: string, initialVideo: boolean }) {
    const isConnected = useIsConnected();
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(initialVideo);
    
    useJoin({ appid: appId, channel: channelId, token: null }, true);

    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);
    
    // Publish tracks based on toggle state
    // Note: usePublish automatically handles null/undefined tracks
    usePublish([localMicrophoneTrack, localCameraTrack]);

    const remoteUsers = useRemoteUsers();
    // Filter out users who don't have audio to prevent subscription errors (Audio)
    const audioUsers = remoteUsers.filter(user => user.hasAudio);
    const { audioTracks } = useRemoteAudioTracks(audioUsers);

    // Filter out users who don't have video to prevent subscription errors (Video)
    const videoUsers = remoteUsers.filter(user => user.hasVideo);
    useRemoteVideoTracks(videoUsers);

    // Audio Playback
    useEffect(() => {
        audioTracks.map(track => track.play());
        return () => {
            audioTracks.map(track => track.stop());
        };
    }, [audioTracks]);

    return (
        <div className="flex-1 flex flex-col p-4 gap-4">
            <div className="flex items-center justify-between">
                <div className="font-bold text-lg">Room: {channelId.slice(-4)}</div>
                <div className="text-xs text-slate-400">{isConnected ? "Connected" : "Connecting..."}</div>
            </div>
            
            {/* Grid of Videos/Users */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto w-full max-w-6xl mx-auto">
                {/* Local User */}
                <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative shadow-lg border border-slate-700">
                     {cameraOn && localCameraTrack ? (
                         <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center">
                             <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center">
                                 <User size={40} />
                             </div>
                         </div>
                     )}
                     <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs font-bold">You</div>
                     {!micOn && <div className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><MicOff size={12} /></div>}
                </div>

                {/* Remote Users */}
                {remoteUsers.map(user => (
                    <div key={user.uid} className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative shadow-lg border border-slate-700">
                        {user.hasVideo ? (
                            <RemoteVideoTrack track={user.videoTrack} play className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                                    <User size={40} />
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs font-bold">{user.uid}</div>
                        {!user.hasAudio && <div className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><MicOff size={12} /></div>}
                    </div>
                ))}
            </div>

            {/* Controls Bar */}
            <div className="h-20 flex items-center justify-center gap-6">
                <button 
                    onClick={() => setMicOn(!micOn)}
                    className={`p-4 rounded-full transition-colors shadow-lg ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}
                    title="Toggle Mic"
                >
                    {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button 
                    onClick={() => setCameraOn(!cameraOn)}
                    className={`p-4 rounded-full transition-colors shadow-lg ${cameraOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}
                    title="Toggle Camera"
                >
                    {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button 
                    onClick={() => window.history.back()}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow-lg"
                    title="Leave Call"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
}
