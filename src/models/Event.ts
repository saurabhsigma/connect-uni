import mongoose, { Schema, model, models } from 'mongoose';

const EventSchema = new Schema({
    organizerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    date: {
        type: Date,
        required: [true, 'Please provide a date'],
    },
    time: {
        type: String, // Store time as string (e.g., "14:30")
        required: [true, 'Please provide a time'],
    },
    location: {
        type: String,
        required: [true, 'Please provide a location'],
    },
    image: {
        type: String, // URL
    },
    attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Event || model('Event', EventSchema);
