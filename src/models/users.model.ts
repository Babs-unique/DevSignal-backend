import mongoose from 'mongoose'


const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        minlength: 2
    },
    githubId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatarUrl: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    expiresAt: {
        type: Date,
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }},
    {
        timestamps: true,
        versionKey: false
    }
);

export const User = mongoose.model('User', userSchema);