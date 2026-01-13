"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const CampusHoodmap = dynamic(() => import("@/components/map/CampusHoodmap").then(mod => ({ default: mod.CampusHoodmap })), {
    ssr: false,
    loading: () => <div className="w-full h-screen flex items-center justify-center bg-background">Loading map...</div>,
});

export default function HoodmapsPage() {
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center bg-background">Loading...</div>}>
            <CampusHoodmap />
        </Suspense>
    );
}
