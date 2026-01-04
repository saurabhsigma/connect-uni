import mongoose, { Schema, model, models } from "mongoose";

const GroupChatSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export const GroupChat = models.GroupChat || model("GroupChat", GroupChatSchema);
