import mongoose, { Schema,model,models } from "mongoose";

const serverMembersSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: "Server", required: true },
    roles: [{ type: mongoose.Schema.Types.ObjectId }], 
    
    nickname: { type: String },
    rulesAccepted: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
},{timestamps:true});

// Compound index to ensure unique membership per server
serverMembersSchema.index({ serverId: 1, userId: 1 }, { unique: true });

export const ServerMembers = models.ServerMembers || model("ServerMembers",serverMembersSchema);
