import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserLocation extends Document {
  userId: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: number[]; // [lng, lat]
  };
  placeName?: string; // Keeping for backward compatibility or general checking
  tagType?: 'best' | 'worst' | 'couple' | 'study' | 'boring';
  tagText?: string;
  createdAt: Date;
}

const UserLocationSchema: Schema<IUserLocation> = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
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
  placeName: { type: String },
  tagType: {
    type: String,
    enum: ['best', 'worst', 'couple', 'study', 'boring']
  },
  tagText: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Create 2dsphere index for geospatial queries
UserLocationSchema.index({ location: '2dsphere' });

const UserLocation: Model<IUserLocation> =
  mongoose.models.UserLocation || mongoose.model<IUserLocation>('UserLocation', UserLocationSchema);

export default UserLocation;
