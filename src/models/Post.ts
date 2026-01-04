import mongoose, { Schema, model, models } from 'mongoose';

const PostSchema = new Schema({
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Please provide content'],
    },
    category: {
        type: String,
        enum: ['General', 'Clubs', 'Academic', 'Events', 'Other'],
        default: 'General',
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    comments: [{
        authorId: { type: Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Post || model('Post', PostSchema);
