import mongoose, { Schema, model, models } from 'mongoose';

const TicketSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ticketCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    qrCode: {
        type: String, // Base64 encoded QR code
    },
    status: {
        type: String,
        enum: ['valid', 'used', 'cancelled'],
        default: 'valid',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed', // Default for free events
    },
    paymentAmount: {
        type: Number,
        default: 0,
    },
    scannedAt: {
        type: Date,
        default: null,
    },
    scannedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    purchasedAt: {
        type: Date,
        default: Date.now,
    },
    attendeeInfo: {
        name: String,
        email: String,
        phone: String,
    },
});

// Index for faster queries
TicketSchema.index({ eventId: 1, userId: 1 });
TicketSchema.index({ ticketCode: 1 });

export default models.Ticket || model('Ticket', TicketSchema);
