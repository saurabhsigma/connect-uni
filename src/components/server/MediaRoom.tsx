"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/providers/SocketProvider";

interface MediaRoomProps {
    channelId: string;
    video?: boolean;
}

interface PeerConnection {
    pc: RTCPeerConnection;
    stream: MediaStream | null;
}

const iceServers: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

export default function MediaRoom({ channelId, video = false }: MediaRoomProps) {
    const { socket } = useSocket();
    const { data: session } = useSession();
    
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Record<string, PeerConnection>>({});
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(video);
    
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const localStreamRef = useRef<MediaStream | null>(null);

    
    // Initialize local media stream
    useEffect(() => {
        let stream: MediaStream;
        
        const initMedia = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: video,
                });
                
                stream.getAudioTracks()[0].enabled = micOn;
                if (video && stream.getVideoTracks()[0]) {
                    stream.getVideoTracks()[0].enabled = cameraOn;
                }
                
                setLocalStream(stream);
                localStreamRef.current = stream;
                console.log("[LOCAL] Media initialized", { audio: stream.getAudioTracks().length, video: stream.getVideoTracks().length });
            } catch (error) {
                console.error("[LOCAL] Failed to get media:", error);
            }
        };
        
        initMedia();
        
        return () => {
            stream?.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        };
    }, [video]);
    
    // Toggle mic
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = micOn;
            });
        }
    }, [micOn, localStream]);
    
    // Toggle camera
    useEffect(() => {
        if (localStream && video) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = cameraOn;
            });
        }
    }, [cameraOn, localStream, video]);
    
    // WebRTC signaling
    useEffect(() => {
        if (!socket) {
            console.log("[WEBRTC] Socket not ready");
            return;
        }
        if (!localStream) {
            console.log("[WEBRTC] Local stream not ready");
            return;
        }
        
        console.log("[WEBRTC] Joining room:", channelId, "Socket:", socket.id);
        socket.emit("webrtc:join", { roomId: channelId, userId: session?.user?.id });
        
        // Create peer connection
        const createPeerConnection = (peerId: string): RTCPeerConnection => {
            console.log("[PEER] Creating connection for:", peerId);
            
            const pc = new RTCPeerConnection(iceServers);
            
            // Add local tracks
            localStream.getTracks().forEach(track => {
                console.log("[PEER] Adding local track:", track.kind, "to", peerId);
                pc.addTrack(track, localStream);
            });
            
            // Handle incoming tracks
            pc.ontrack = (event) => {
                console.log("[PEER] Received track from:", peerId, event.track.kind);
                console.log("[PEER] Stream ID:", event.streams[0]?.id, "Tracks:", event.streams[0]?.getTracks().length);
                const remoteStream = event.streams[0];
                
                if (remoteStream) {
                    setPeers(prev => {
                        console.log("[STATE] Adding peer to state:", peerId);
                        return {
                            ...prev,
                            [peerId]: { pc, stream: remoteStream }
                        };
                    });
                } else {
                    console.error("[PEER] No stream in ontrack event from:", peerId);
                }
            };
            
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("[ICE] Sending candidate to:", peerId);
                    socket.emit("webrtc:signal", {
                        to: peerId,
                        candidate: event.candidate,
                    });
                }
            };
            
            // Connection state logging
            pc.onconnectionstatechange = () => {
                console.log("[PEER] Connection state:", peerId, pc.connectionState);
                if (pc.connectionState === "connected") {
                    console.log("[PEER] ✓ Successfully connected to:", peerId);
                } else if (pc.connectionState === "failed") {
                    console.error("[PEER] ✗ Connection failed with:", peerId);
                    setPeers(prev => {
                        const next = { ...prev };
                        delete next[peerId];
                        return next;
                    });
                } else if (pc.connectionState === "closed") {
                    console.log("[PEER] Connection closed with:", peerId);
                    setPeers(prev => {
                        const next = { ...prev };
                        delete next[peerId];
                        return next;
                    });
                }
            };
            
            pc.oniceconnectionstatechange = () => {
                console.log("[ICE] Connection state:", peerId, pc.iceConnectionState);
                if (pc.iceConnectionState === "failed") {
                    console.error("[ICE] ✗ ICE failed with:", peerId, "- attempting restart");
                    pc.restartIce();
                }
            };
            
            peersRef.current[peerId] = pc;
            return pc;
        };
        
        // Handle existing peers in room - NEW JOINER sends offers to all existing peers
        socket.on("webrtc:peers", async ({ peers: peerList }: { peers: string[] }) => {
            console.log("[ROOM] I am NEW - Existing peers:", peerList, "My ID:", socket.id);
            
            for (const peerId of peerList) {
                // Only create offer if we don't already have a connection
                if (peersRef.current[peerId]) {
                    console.log("[ROOM] Already have connection with:", peerId);
                    continue;
                }
                
                try {
                    const pc = createPeerConnection(peerId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    
                    console.log("[OFFER] NEW JOINER sending offer to existing peer:", peerId);
                    socket.emit("webrtc:signal", {
                        to: peerId,
                        offer: offer,
                    });
                } catch (error) {
                    console.error("[OFFER] Failed for:", peerId, error);
                }
            }
        });
        
        // Handle new peer joining - EXISTING PEERS just log, don't send offers
        // The new peer will send offers to us
        socket.on("webrtc:peer-joined", ({ peerId }: { peerId: string }) => {
            console.log("[ROOM] I am EXISTING - New peer joined:", peerId, "My ID:", socket.id);
            console.log("[ROOM] Waiting for offer from new peer:", peerId);
        });
        
        // Handle signaling
        socket.on("webrtc:signal", async ({ from, offer, answer, candidate }: any) => {
            console.log("[SIGNAL] From:", from, { hasOffer: !!offer, hasAnswer: !!answer, hasCandidate: !!candidate });
            
            try {
                let pc = peersRef.current[from];
                
                if (offer) {
                    console.log("[OFFER] Received from:", from);
                    if (!pc) {
                        console.log("[OFFER] Creating new peer connection for:", from);
                        pc = createPeerConnection(from);
                    }
                    
                    // Check signaling state before setting remote description
                    if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
                        console.warn("[OFFER] Wrong signaling state:", pc.signalingState, "- skipping");
                        return;
                    }
                    
                    console.log("[OFFER] Setting remote description from:", from, "State:", pc.signalingState);
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    
                    console.log("[ANSWER] Creating answer for:", from);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    console.log("[ANSWER] Sending to:", from);
                    socket.emit("webrtc:signal", {
                        to: from,
                        answer: answer,
                    });
                }
                
                if (answer) {
                    if (!pc) {
                        console.warn("[ANSWER] No peer connection for:", from, "- ignoring answer");
                        return;
                    }
                    
                    // Check signaling state before setting remote answer
                    if (pc.signalingState !== "have-local-offer") {
                        console.warn("[ANSWER] Wrong signaling state:", pc.signalingState, "- expected have-local-offer");
                        return;
                    }
                    
                    console.log("[ANSWER] Setting remote description from:", from, "State:", pc.signalingState);
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log("[ANSWER] Connection established with:", from, "State:", pc.connectionState);
                }
                
                if (candidate) {
                    if (!pc) {
                        console.warn("[ICE] No peer connection for:", from, "- ignoring candidate");
                        return;
                    }
                    
                    // Only add ICE candidate if remote description is set
                    if (pc.remoteDescription) {
                        console.log("[ICE] Adding candidate from:", from);
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        console.warn("[ICE] Remote description not set yet, buffering candidate from:", from);
                        // The candidate will be added after setRemoteDescription
                    }
                }
            } catch (error) {
                console.error("[SIGNAL] Error processing from:", from, error);
            }
        });
        
        // Handle peer leaving
        socket.on("webrtc:peer-left", ({ peerId }: { peerId: string }) => {
            console.log("[ROOM] Peer left:", peerId);
            
            const pc = peersRef.current[peerId];
            if (pc) {
                pc.close();
                delete peersRef.current[peerId];
            }
            
            setPeers(prev => {
                const next = { ...prev };
                delete next[peerId];
                return next;
            });
        });
        
        return () => {
            console.log("[ROOM] Leaving room:", channelId);
            socket.emit("webrtc:leave", { roomId: channelId });
            
            // Close all peer connections
            Object.values(peersRef.current).forEach(pc => pc.close());
            peersRef.current = {};
            
            socket.off("webrtc:peers");
            socket.off("webrtc:peer-joined");
            socket.off("webrtc:signal");
            socket.off("webrtc:peer-left");
        };
    }, [socket, localStream, channelId, session?.user?.id]);
    
    const leaveCall = () => {
        window.history.back();
    };
    
    return (
        <div className="h-full w-full flex flex-col bg-slate-950 text-white p-6">
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <h2 className="text-2xl font-bold text-slate-200">
                    {video ? "Video" : "Voice"} Channel
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
                    {/* Local stream */}
                    <MediaTile
                        stream={localStream}
                        label={session?.user?.name || "You"}
                        isLocal={true}
                        showVideo={video && cameraOn}
                    />
                    
                    {/* Remote streams */}
                    {Object.entries(peers).map(([peerId, peer]) => (
                        <MediaTile
                            key={peerId}
                            stream={peer.stream}
                            label={`Peer ${peerId.slice(-4)}`}
                            isLocal={false}
                            showVideo={video}
                        />
                    ))}
                </div>
                
                <div className="text-slate-400 text-sm space-y-1">
                    <div>Socket ID: {socket?.id || "Not connected"}</div>
                    <div>Connected peers: {Object.keys(peers).length}</div>
                    <div>Peer IDs: {Object.keys(peers).join(", ") || "None"}</div>
                    <div>Local tracks: Audio={localStream?.getAudioTracks().length || 0}, Video={localStream?.getVideoTracks().length || 0}</div>
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pb-4">
                <button
                    onClick={() => setMicOn(prev => !prev)}
                    className={`p-4 rounded-full transition-all ${
                        micOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-500 hover:bg-red-600"
                    }`}
                >
                    {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                
                {video && (
                    <button
                        onClick={() => setCameraOn(prev => !prev)}
                        className={`p-4 rounded-full transition-all ${
                            cameraOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-500 hover:bg-red-600"
                        }`}
                    >
                        {cameraOn ? <Camera size={24} /> : <CameraOff size={24} />}
                    </button>
                )}
                
                <button
                    onClick={leaveCall}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
}

interface MediaTileProps {
    stream: MediaStream | null;
    label: string;
    isLocal: boolean;
    showVideo: boolean;
}

function MediaTile({ stream, label, isLocal, showVideo }: MediaTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            if (!isLocal) {
                // Ensure audio plays for remote streams
                videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
            }
        }
    }, [stream, isLocal]);
    
    return (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
            {showVideo && stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                <>
                    {/* Hidden video element for audio in voice-only mode */}
                    {stream && !showVideo && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted={isLocal}
                            className="hidden"
                        />
                    )}
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                            <User size={32} className="text-slate-300" />
                        </div>
                        <span className="text-slate-300 font-medium">{label}</span>
                    </div>
                </>
            )}
            
            <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 rounded-full text-sm text-white">
                {label}
            </div>
        </div>
    );
}
