import mongoose, { Schema, model, models } from "mongoose";

const ConversationSchema = new Schema({
    memberOneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    memberTwoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique conversation between two users
ConversationSchema.index({ memberOneId: 1, memberTwoId: 1 }, { unique: true });

export const Conversation = models.Conversation || model("Conversation", ConversationSchema);
