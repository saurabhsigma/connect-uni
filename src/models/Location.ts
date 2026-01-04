import mongoose, { Schema, model, models } from 'mongoose';

const LocationSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a location name'],
        unique: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Hostel', 'Food', 'Study', 'Sports', 'Other'],
    },
    description: {
        type: String,
    },
    coordinates: {
        lat: Number,
        lng: Number, // Optional for MVP if we just list them
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviews: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        text: String,
        rating: Number,
        createdAt: { type: Date, default: Date.now }
    }],
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Location || model('Location', LocationSchema);
