import { getAvatarById } from "@/lib/avatars";

interface AvatarProps {
  avatarId?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function Avatar({ avatarId = "boy1", name, size = "md", className = "" }: AvatarProps) {
  const avatar = getAvatarById(avatarId);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xl",
    md: "w-12 h-12 text-3xl",
    lg: "w-16 h-16 text-4xl",
    xl: "w-24 h-24 text-6xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 flex items-center justify-center shadow-lg ${className}`}
      title={name || avatar.label}
    >
      {avatar.emoji}
    </div>
  );
}
