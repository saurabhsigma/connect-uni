import mongoose, { Schema, model, models } from 'mongoose';

const roleSchema = new Schema({
    name: { type: String, required: true },
    color: { type: String, default: "#000000" },
    icon: { type: String }, // Optional role icon
    permissions: [{ type: String }], // Array of permission strings e.g. "MANAGE_CHANNELS"
    position: { type: Number, default: 0 },
});

const serverSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    inviteCode: { type: String, unique: true },
    rules: { type: String }, // Markdown content for rules
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    roles: [roleSchema], // Embedded roles
},{timestamps:true});

export const Server = models.Server || model('Server', serverSchema);
