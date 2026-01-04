import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerifiedPlace extends Document {
    name: string;
    location: {
        type: 'Point';
        coordinates: number[];
    };
    count: number;
    verifiedAt: Date;
}

const VerifiedPlaceSchema: Schema<IVerifiedPlace> = new Schema({
    name: { type: String, required: true },
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
    verifiedAt: { type: Date, default: Date.now },
});

VerifiedPlaceSchema.index({ location: '2dsphere' });

const VerifiedPlace: Model<IVerifiedPlace> =
    mongoose.models.VerifiedPlace || mongoose.model<IVerifiedPlace>('VerifiedPlace', VerifiedPlaceSchema);

export default VerifiedPlace;
