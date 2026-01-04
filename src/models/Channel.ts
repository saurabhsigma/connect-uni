import mongoose, { Schema, model, models } from "mongoose";

const ChannelSchema = new Schema({
    name: {
        type: String,
        required: [true, "Channel name is required"],
        maxlength: [100, "Channel name cannot exceed 100 characters"],
        trim: true,
    },
    type: {
        type: String,
        enum: ["text", "audio", "video"],
        default: "text",
    },
    serverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
        required: true,
        index: true,
    },
    categoryId: {
        type: String, 
        // Can be an ID or just a string name for grouping. 
        // For advanced logic, this could be another Schema. keeping simple for now.
        default: "General"
    },
    position: {
        type: Number,
        default: 0,
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    allowedUsers: [{ // For Private Channels: List of UserIDs allowed to see it
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    userId: { // Creator ID
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true });

export const Channel = models.ServerChannel || model("ServerChannel", ChannelSchema);
