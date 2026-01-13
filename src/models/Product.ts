import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
    sellerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: false,
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    offerPrice: {
        type: Number,
        default: null,
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
    },
    productType: {
        type: String,
        enum: ['Physical', 'Digital', 'Service', 'Rental'],
        default: 'Physical',
    },
    images: [{
        type: String,
    }],
    image: {
        type: String, // Backward compatibility
    },
    tags: [{
        type: String,
    }],
    stock: {
        type: Number,
        default: 1,
    },
    status: {
        type: String,
        enum: ['available', 'in-bid', 'sold'],
        default: 'available',
    },
    bids: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        amount: Number,
        message: String,
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Product || model('Product', ProductSchema);
