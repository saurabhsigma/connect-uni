"use client";

import { MessageSquare } from "lucide-react";

export default function MessagesHome() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare size={64} className="mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Welcome to Messages</h2>
            <p className="text-center max-w-sm">
                Select a conversation from the sidebar or search for someone new to start chatting!
            </p>
        </div>
    );
}
