const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema({
  platformName: {
    type: String,
    default: 'Taskvra',
    trim: true
  },
  logoUrl: {
    type: String,
    default: null
  },
  platformCommissionPercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  minBidAmount: {
    type: Number,
    default: 1,
    min: 1
  },
  maxBidsPerGig: {
    type: Number,
    default: 50,
    min: 1
  },
  maxBidsPerFreelancerPerDay: {
    type: Number,
    default: 20,
    min: 1
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentGateways: {
    stripe: { type: Boolean, default: false },
    paypal: { type: Boolean, default: false },
    razorpay: { type: Boolean, default: true }
  },
  supportEmail: {
    type: String,
    default: null
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  emailNotificationsEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);