import mongoose from "mongoose";

const rateLimitLogSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        index: true // For faster lookups
    },
    count: {
        type: Number,
        required: true,
        default: 0
    },
    lastRequest: {
        type: Date,
        required: true,
        default: Date.now
    },
    windowStart: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index for efficient cleanup
rateLimitLogSchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

// Add method to check if window has expired
rateLimitLogSchema.methods.isWindowExpired = function(windowMs) {
    return Date.now() - this.windowStart.getTime() >= windowMs;
};

// Add method to reset for new window
rateLimitLogSchema.methods.resetWindow = function() {
    this.count = 1;
    this.windowStart = new Date();
    this.lastRequest = new Date();
};

const RateLimitLog = mongoose.model("RateLimitLog", rateLimitLogSchema);

export default RateLimitLog;
