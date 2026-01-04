import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'], // Only for credentials auth
        select: false,
    },
    image: {
        type: String,
    },
    avatar: {
        type: String,
        default: 'boy1',
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'moderator'],
        default: 'student',
    },
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot be more than 200 characters'],
    },
    courses: [{
        type: String,
    }],
    interests: [{
        type: String,
    }],
    socialLinks: {
        linkedin: String,
        github: String,
        twitter: String,
        instagram: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.User || model('User', UserSchema);
