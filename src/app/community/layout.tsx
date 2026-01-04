export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 z-10">
                {children}
            </main>
        </div>
    );
}

