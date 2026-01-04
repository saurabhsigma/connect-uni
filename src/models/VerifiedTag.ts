import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerifiedTag extends Document {
    tagText: string;
    tagType: 'best' | 'worst' | 'couple' | 'study' | 'boring';
    location: {
        type: 'Point';
        coordinates: number[];
    };
    count: number; // Number of unique users confirming this vibe
    lastActive: Date;
}

const VerifiedTagSchema: Schema<IVerifiedTag> = new Schema({
    tagText: { type: String, required: true },
    tagType: {
        type: String,
        enum: ['best', 'worst', 'couple', 'study', 'boring'],
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    count: { type: Number, default: 1 },
    lastActive: { type: Date, default: Date.now },
});

VerifiedTagSchema.index({ location: '2dsphere' });

const VerifiedTag: Model<IVerifiedTag> =
    mongoose.models.VerifiedTag || mongoose.model<IVerifiedTag>('VerifiedTag', VerifiedTagSchema);

export default VerifiedTag;
