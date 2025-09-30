import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'subscription name is required'],
        trim: true,
        minLength: 2,
        maxLength: 100
    },

    price: {
        type: Number,
        required: [true, 'subscription price is required'],
        minLength: 0
    },

    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'INR', 'PKR'],
        default: 'INR'
    },

    frequency: {
        type: String,
        enum: ['Monthly', 'Yearly', 'Weekly'],
        required: true
    },

    category: {
        type: String,
        enum: ['Entertainment', 'Health', 'Education', 'Fitness', 'Other'],
        required: [true, 'subscription category is required']
    },

    paymentMethod: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },

    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: (value) => value <= new Date(),
            message: 'Start date must be in the past'
        }
    },

    renewalDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) { return value > this.startDate },
            message: 'Renewal date must be after start date'
        }
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

}, { timestamps: true });

// auto calculate renewal date
subscriptionSchema.pre('save', function (next) {
    if (!this.renewalDate) {
        const renewalPeriods = {
            Monthly: 30,
            Yearly: 365,
            Weekly: 7
        }
        this.renewalDate = new Date(this.startDate)
        this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriods[this.frequency])
        
    }
    next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
