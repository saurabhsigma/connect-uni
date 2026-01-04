import mongoose, { Schema, model, models } from "mongoose";

const ServerBanSchema = new Schema({
    serverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
        required: true,
        index: true,
    },
    userId: { // The banned user
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bannedById: { // Who banned them
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reason: {
        type: String,
    },
}, { timestamps: true });

// Compound index for quick lookups
ServerBanSchema.index({ serverId: 1, userId: 1 }, { unique: true });

export const ServerBan = models.ServerBan || model("ServerBan", ServerBanSchema);
