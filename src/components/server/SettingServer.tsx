"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import MembersList from "@/components/server/MembersList";
import InviteManager from "@/components/server/InviteManager";
import { Settings, LogOut, X, Save, Trash2, Shield, UserMinus, Ban } from "lucide-react";
import clsx from "clsx";


export default function ServerSettingsModal({ server, onClose, onUpdate, canManage, isOwner }: any) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    // Overview State
    const [name, setName] = useState(server.name);
    const [rules, setRules] = useState(server.rules || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/servers/${server._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, rules }),
            });
            if (res.ok) {
                onUpdate();
                alert("Settings saved!");
            } else {
                alert("Failed to update server");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this server? This action cannot be undone.")) return;
         try {
            const res = await fetch(`/api/servers/${server._id}`, { method: "DELETE" });
            if (res.ok) router.push("/community");
            else alert("Failed to delete server");
        } catch (error) { console.error(error); }
    };
    
    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this server?")) return;
        try {
            const res = await fetch(`/api/servers/${server._id}/leave`, { method: "DELETE" });
            if (res.ok) router.push("/community");
            else {
                const data = await res.json();
                alert(data.message || "Failed to leave");
            }
        } catch (error) { console.error(error); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex overflow-hidden animate-in fade-in zoom-in-95">
                {/* Sidebar */}
                <div className="w-48 bg-secondary/10 border-r border-border p-4 flex flex-col gap-1">
                    <h2 className="font-bold text-sm uppercase text-muted-foreground mb-2 px-2">Settings</h2>
                    {['overview', 'members', 'invites'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "text-left px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                                activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                    
                    <div className="mt-auto pt-4 border-t border-border">
                        <button 
                            onClick={handleLeave}
                            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <LogOut size={16} /> Leave Server
                        </button>
                    </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                        <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Server Name</label>
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Community Rules</label>
                                <textarea 
                                    value={rules}
                                    onChange={(e) => setRules(e.target.value)}
                                    className="w-full h-32 bg-input border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                                    placeholder="Set guidelines for your community..."
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                            </button>
                            
                            <div className="pt-8 mt-8 border-t border-border">
                                <h3 className="font-bold text-red-500 mb-2">Danger Zone</h3>
                                <button 
                                    onClick={handleDelete}
                                    className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> Delete Server
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && <MembersList serverId={server._id} canManage={canManage} isOwner={isOwner} />}
                    {activeTab === 'invites' && <InviteManager serverId={server._id} />}

                </div>
            </div>
        </div>
    );
}