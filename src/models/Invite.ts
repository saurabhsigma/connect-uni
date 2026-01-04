import mongoose, { Schema, model, models } from "mongoose";

const InviteSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    serverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
        required: true,
        index: true,
    },
    inviterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    maxUses: { // 0 = infinite
        type: Number,
        default: 0, 
    },
    uses: {
        type: Number,
        default: 0,
    },
    expiresAt: { // Null = never
        type: Date,
    },
}, { timestamps: true });

export const Invite = models.Invite || model("Invite", InviteSchema);
