import mongoose, { Schema, model, models } from "mongoose";

const ConversationSchema = new Schema({
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct',
    },
    name: {
        type: String,
    },
    image: {
        type: String,
    },
    memberOneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    memberTwoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GroupChat",
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique conversation between two users for direct messages
ConversationSchema.index({ memberOneId: 1, memberTwoId: 1, type: 1 }, { sparse: true });

export const Conversation = models.Conversation || model("Conversation", ConversationSchema);
