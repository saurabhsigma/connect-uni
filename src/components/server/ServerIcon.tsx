"use client";

import Link from "next/link";
import clsx from "clsx";

export default function ServerIcon({ name, image, icon, href, active, color }: any) {
    if (href) {
        return (
            <Link href={href} className="relative group w-full flex justify-center">
                {/* Active Indicator */}
                <div className={clsx(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-foreground rounded-r-lg transition-all duration-200",
                    active ? "h-8" : "h-0 group-hover:h-5"
                )} />

                {/* Icon Circle */}
                <div className={clsx(
                    "flex items-center justify-center w-12 h-12 transition-all duration-200 overflow-hidden shadow-sm",
                    active ? "rounded-[16px]" : "rounded-[24px] group-hover:rounded-[16px]",
                    active || color ? (color || "bg-primary text-primary-foreground") : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                )}>
                    {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        icon || <span className="font-bold text-sm">{name.substring(0, 2).toUpperCase()}</span>
                    )}
                </div>
            </Link>
        );
    }
    return null;
}
