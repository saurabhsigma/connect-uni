"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Hash, Send, Paperclip, User, Smile, X } from "lucide-react";
import MediaRoom from "@/components/server/MediaRoom";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useSocket } from "@/components/providers/SocketProvider";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function ChatPage() {
    const params = useParams();
    const serverId = params?.serverId as string;
    const channelId = params?.channelId as string;
    const { data: session } = useSession();

    const [channel, setChannel] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [showEmoji, setShowEmoji] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFetchingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { socket } = useSocket();

    // 1. Fetch Channel & Messages
    useEffect(() => {
        if (!channelId) return;
        fetchChannel();
        fetchMessages();
    }, [channelId]);

    // 2. Socket Integration
    useEffect(() => {
        if (!socket || !channelId) return;

        socket.emit("join-room", channelId);

        const handleNewMessage = (message: any) => {
            if (message.channelId === channelId) {
                setMessages(prev => {
                    // deduplicate
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        };

        socket.on("new-message", handleNewMessage);

        return () => {
            socket.off("new-message", handleNewMessage);
        };
    }, [socket, channelId]);


    const fetchChannel = async () => {
        try {
            const res = await fetch(`/api/channels/${channelId}`);
            if (res.ok) setChannel(await res.json());
        } catch (e) { console.error(e); }
    }

    const fetchMessages = async (options: { background?: boolean } = {}) => {
        const { background = false } = options;
        if (isFetchingRef.current && !background) return;
        isFetchingRef.current = true;
        if (!background) setLoading(true);

        try {
            const res = await fetch(`/api/channels/${channelId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (!background) scrollToBottom();
            }
        } catch (error) {
            console.error(error);
        } finally {
            isFetchingRef.current = false;
            if (!background) setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !fileUrl) || !session) return;

        try {
            const payload = {
                content: newMessage,
                fileUrl: fileUrl
            };

            const res = await fetch(`/api/channels/${channelId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const msg = await res.json();

                // Optimistic Update
                setMessages(prev => [...prev, msg]);
                setNewMessage("");
                setFileUrl(null);
                scrollToBottom();

                // Socket Emit
                if (socket) {
                    socket.emit("send-message", { ...msg, channelId });
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setFileUrl(data.url);
        } catch (error) {
            alert("Failed to upload file");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const onEmojiClick = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmoji(false);
    };

    // Render Voice/Video Room
    if (channel?.type === 'audio') {
        return <MediaRoom channelId={channelId} video={false} />;
    }
    if (channel?.type === 'video') {
        return <MediaRoom channelId={channelId} video={true} />;
    }

    // Render Text Chat
    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Channel Header */}
            <div className="h-12 border-b border-border flex items-center px-4 shadow-sm bg-background/50 backdrop-blur shrink-0 justify-between">
                <div className="flex items-center">
                    <Hash size={20} className="text-muted-foreground mr-2" />
                    <span className="font-bold">{channel?.name || "chat"}</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Loading contents...</div>
                ) : (
                    messages.map((msg, i) => {
                        const isSameUser = i > 0 && messages[i - 1].senderId?._id === msg.senderId?._id;
                        const date = new Date(msg.createdAt);

                        return (
                            <div key={msg._id} className={`flex gap-3 group ${isSameUser ? 'mt-1' : 'mt-4'} hover:bg-secondary/5 -mx-2 px-2 py-1 rounded transition-colors`}>
                                {!isSameUser ? (
                                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                        {msg.senderId?.image ? (
                                            <img src={msg.senderId.image} alt={msg.senderId.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} />
                                        )}
                                    </div>
                                ) : <div className="w-10 shrink-0" />}

                                <div className="flex-1 overflow-hidden">
                                    {!isSameUser && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold hover:underline cursor-pointer">{msg.senderId?.name || "User"}</span>
                                            <span className="text-xs text-muted-foreground">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}

                                    <div className="text-foreground/90 whitespace-pre-wrap break-words">
                                        {msg.content}
                                    </div>

                                    {/* Attachment Display */}
                                    {msg.fileUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-sm">
                                            <img src={msg.fileUrl} alt="attachment" className="w-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background">
                {fileUrl && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-secondary/10 rounded-lg max-w-fit border border-border">
                        <span className="text-xs font-mono truncate max-w-[200px]">Attachment Ready</span>
                        <button onClick={() => setFileUrl(null)} className="text-muted-foreground hover:text-red-500"><X size={14} /></button>
                    </div>
                )}

                <div className="bg-secondary/20 rounded-lg p-2 flex items-center gap-2 border border-transparent focus-within:border-indigo-500/50 transition-colors relative">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-background transition-colors"
                    >
                        {uploading ? <span className="animate-spin text-xs">⏳</span> : <Paperclip size={20} />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />

                    <textarea
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none max-h-32 py-2"
                        placeholder={`Message #${channel?.name || "chat"}`}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
                        rows={1}
                    />

                    <div className="relative">
                        <button
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="p-2 text-muted-foreground hover:text-yellow-500 rounded-full hover:bg-background transition-colors"
                        >
                            <Smile size={20} />
                        </button>
                        {showEmoji && (
                            <div className="absolute bottom-12 right-0 shadow-2xl rounded-xl border border-border overflow-hidden z-20">
                                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleSend()}
                        disabled={(!newMessage.trim() && !fileUrl) || uploading}
                        className="p-2 text-indigo-500 hover:text-indigo-600 disabled:opacity-50 disabled:grayscale transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
