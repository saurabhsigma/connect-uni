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
        type: String,
        required: [true, 'Please provide a time'],
    },
    location: {
        type: String,
        required: [true, 'Please provide a location'],
    },
    image: {
        type: String,
    },
    // Ticketing fields
    eventType: {
        type: String,
        enum: ['free', 'paid'],
        default: 'free',
        required: true,
    },
    ticketPrice: {
        type: Number,
        default: 0,
        min: 0,
    },
    maxAttendees: {
        type: Number,
        default: null, // null means unlimited
    },
    category: {
        type: String,
        enum: ['concert', 'workshop', 'seminar', 'sports', 'cultural', 'food', 'tech', 'other'],
        default: 'other',
    },
    tags: [{
        type: String,
    }],
    attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    registeredCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Event || model('Event', EventSchema);
