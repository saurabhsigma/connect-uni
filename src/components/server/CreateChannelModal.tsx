"use client";

import { useState, useEffect } from "react";
import { X, Lock, Hash, Volume2, Check, Video } from "lucide-react";
import clsx from "clsx";

export default function CreateChannelModal({ serverId, type, onClose, onCreated }: any) {
    const [name, setName] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isPrivate) {
            fetchMembers();
        }
    }, [isPrivate]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/servers/${serverId}/members`);
            if (res.ok) setMembers(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/servers/${serverId}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type,
                    isPrivate,
                    allowedUsers: isPrivate ? selectedMembers : []
                }),
            });

            if (res.ok) {
                onCreated();
            } else {
                alert("Failed to create channel");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (userId: string) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedMembers(prev => [...prev, userId]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="font-bold text-lg">Create {type === 'text' ? 'Text' : type === 'audio' ? 'Voice' : 'Video'} Channel</h2>
                    <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium uppercase text-muted-foreground">Channel Name</label>
                        <div className="flex items-center bg-input border border-border rounded-md px-3 py-2">
                            {type === 'text' && <Hash size={16} className="text-muted-foreground mr-2" />}
                            {type === 'audio' && <Volume2 size={16} className="text-muted-foreground mr-2" />}
                            {type === 'video' && <Video size={16} className="text-muted-foreground mr-2" />}
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                placeholder="new-channel"
                                className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock size={16} className="text-muted-foreground" />
                                <label className="font-medium">Private Channel</label>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <p className="text-xs text-muted-foreground">Only selected members and roles will be able to view this channel.</p>
                    </div>

                    {isPrivate && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-sm font-medium uppercase text-muted-foreground">Add Members</label>
                            <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                                {members.length === 0 && <div className="text-xs text-muted-foreground p-2">Loading members...</div>}
                                {members.map(m => (
                                    <div 
                                        key={m.userId._id} 
                                        onClick={() => toggleMember(m.userId._id)}
                                        className={clsx(
                                            "flex items-center justify-between p-2 rounded cursor-pointer text-sm",
                                            selectedMembers.includes(m.userId._id) ? "bg-primary/10 text-primary" : "hover:bg-secondary/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold">
                                                {m.userId.name?.[0]}
                                            </div>
                                            <span>{m.userId.name}</span>
                                        </div>
                                        {selectedMembers.includes(m.userId._id) && <Check size={16} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleCreate} 
                            disabled={!name || loading}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Channel"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
