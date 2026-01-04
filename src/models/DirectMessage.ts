import mongoose, { Schema, model, models } from "mongoose";

const DirectMessageSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    attachments: [{
        type: String // URLs
    }],
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const DirectMessage = models.DirectMessage || model("DirectMessage", DirectMessageSchema);
