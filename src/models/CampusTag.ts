import mongoose, { Schema, model, models } from 'mongoose';

export type TagCategory = "Study" | "Food" | "Hangout" | "Crowded" | "Quiet" | "Sports" | "Unsafe" | "Admin";

const CampusTagSchema = new Schema({
    campusId: {
        type: String,
        required: true,
        default: "lpu", // Default to LPU
    },
    category: {
        type: String,
        required: true,
        enum: ["Study", "Food", "Hangout", "Crowded", "Quiet", "Sports", "Unsafe", "Admin"],
    },
    text: {
        type: String,
        maxlength: 120,
        default: "",
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    upvotes: {
        type: Number,
        default: 1, // Start with 1 to avoid dead tags
    },
    downvotes: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Geospatial index for location queries
CampusTagSchema.index({ location: '2dsphere' });
CampusTagSchema.index({ campusId: 1, category: 1 });

export default models.CampusTag || model('CampusTag', CampusTagSchema);
