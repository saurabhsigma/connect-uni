import mongoose, { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
    content: {
        type: String,
        required: [function(this: any) { return !this.fileUrl; }, "Message content is required if no file is attached"], 
    },
    fileUrl: {
        type: String,
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
        index: true,
    },
    memberId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServerMembers",
        required: true,
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const Message = models.Message || model("Message", MessageSchema);
