import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";
import User from "@/models/User";

// 1. Definition of Permissions
export const PERMISSIONS = {
    // General
    VIEW_CHANNELS: "VIEW_CHANNELS",
    MANAGE_SERVER: "MANAGE_SERVER",
    MANAGE_ROLES: "MANAGE_ROLES",
    MANAGE_CHANNELS: "MANAGE_CHANNELS",
    KICK_MEMBERS: "KICK_MEMBERS",
    BAN_MEMBERS: "BAN_MEMBERS",
    CREATE_INVITE: "CREATE_INVITE",
    
    // Text
    SEND_MESSAGES: "SEND_MESSAGES",
    MANAGE_MESSAGES: "MANAGE_MESSAGES", // Delete others' messages
    ATTACH_FILES: "ATTACH_FILES",
    
    // Voice
    CONNECT: "CONNECT",
    SPEAK: "SPEAK",
    
    // Root
    ADMINISTRATOR: "ADMINISTRATOR"
};

// 2. The Resolver Function
export async function can(
  member: any,
  permission: string,
  channel: any = null,
  server: any
): Promise<boolean> {
  if (!member || !server) return false;

  // 1️⃣ OWNER OVERRIDE
  if (server.ownerId.toString() === member.userId.toString()) {
    return true;
  }

  // 2️⃣ BUILD BASE PERMISSIONS (@everyone + roles)
  let permissions = new Set<string>();

  // @everyone role (position 0)
  const everyoneRole = server.roles.find((r: any) => r.name === "Member" || r.name === "@everyone");
  if (everyoneRole) {
    everyoneRole.permissions.forEach((p: string) => permissions.add(p));
  }

  // Member roles
  const memberRoleIds = member.roles.map((r: any) => r.toString());

  server.roles.forEach((role: any) => {
    if (memberRoleIds.includes(role._id.toString())) {
      role.permissions.forEach((p: string) => permissions.add(p));
    }
  });

  // 3️⃣ ADMINISTRATOR OVERRIDE
  if (permissions.has(PERMISSIONS.ADMINISTRATOR)) {
    return true;
  }

  // 4️⃣ NO CHANNEL → SERVER LEVEL CHECK
  if (!channel) {
    return permissions.has(permission);
  }

  // 5️⃣ APPLY CHANNEL OVERWRITES (DISCORD STYLE)

  const overwrites = channel.permissionOverwrites || [];

  // --- @everyone overwrite
  const everyoneOverwrite = overwrites.find(
    (o: any) => o.type === "role" && o.id === everyoneRole?._id.toString()
  );

  if (everyoneOverwrite) {
    if (everyoneOverwrite.deny.includes(permission)) return false;
    if (everyoneOverwrite.allow.includes(permission)) permissions.add(permission);
  }

  // --- Role overwrites
  overwrites
    .filter((o: any) => o.type === "role" && memberRoleIds.includes(o.id))
    .forEach((o: any) => {
      if (o.deny.includes(permission)) permissions.delete(permission);
      if (o.allow.includes(permission)) permissions.add(permission);
    });

  // --- Member overwrite
  const memberOverwrite = overwrites.find(
    (o: any) => o.type === "member" && o.id === member.userId.toString()
  );

  if (memberOverwrite) {
    if (memberOverwrite.deny.includes(permission)) return false;
    if (memberOverwrite.allow.includes(permission)) return true;
  }

  // 6️⃣ FINAL DECISION
  return permissions.has(permission);
}
