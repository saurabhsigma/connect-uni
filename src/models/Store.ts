import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStore extends Document {
  ownerId: mongoose.Types.ObjectId;
  storeName: string;
  storeSlug: string;
  description: string;
  logo: string;
  bannerImage: string;
  categories: { name: string; description: string }[];
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema: Schema<IStore> = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeSlug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    bannerImage: {
      type: String,
      default: '',
    },
    categories: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    contactEmail: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
      default: '',
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from store name before saving
StoreSchema.pre('save', function () {
  if (this.isModified('storeName') && !this.storeSlug) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Create indexes
StoreSchema.index({ isActive: 1 });

const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);

export default Store;
