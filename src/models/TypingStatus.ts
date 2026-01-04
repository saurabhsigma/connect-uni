import mongoose, { Schema, model, models } from "mongoose";

const TypingStatusSchema = new Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
}, { timestamps: true });

TypingStatusSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
// Auto-clean stale typing states
TypingStatusSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 });

export const TypingStatus = models.TypingStatus || model("TypingStatus", TypingStatusSchema);
