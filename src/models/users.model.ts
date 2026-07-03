import mongoose from 'mongoose'


const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function (this: { githubId?: string; googleId?: string }) {
            return !this.githubId && !this.googleId;
        },
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
    googleId: {
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
    resetToken: {
        type: String,
    },
    resetTokenExpiry: {
        type: Date,
    },
    expiresAt: {
        type: Date,
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        type: Date,
    },
    deletionExpiresAt: {
        type: Date,
    },
    deletionPeriod: {
        type: Number,
        default: 30
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