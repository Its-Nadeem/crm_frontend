import mongoose from 'mongoose';

const paymentGatewaySettingSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        enum: ['stripe', 'razorpay', 'paypal', 'payu', 'paytm', 'square', 'braintree', 'adyen', 'authorize.net'],
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true,
        default: ''
    },
    apiSecret: {
        type: String,
        required: true,
        default: ''
    },
    isEnabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const PaymentGatewaySetting = mongoose.model('PaymentGatewaySetting', paymentGatewaySettingSchema);

export default PaymentGatewaySetting;