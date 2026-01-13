import mongoose, { Schema, model, models } from 'mongoose';

const OrderSchema = new Schema({
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productTitle: { type: String, required: true },
    productPrice: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
    status: { type: String, enum: ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    address: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    note: { type: String, default: '' },
    buyerNotified: { type: Boolean, default: false },
    sellerNotified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default models.Order || model('Order', OrderSchema);
