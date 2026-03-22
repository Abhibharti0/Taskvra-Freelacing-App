const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Bid message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Bid price is required'],
    min: [1, 'Price must be at least ₹1'],
    max: [100000000, 'Price cannot exceed ₹10,00,00,000']
  },
  status: {
    type: String,
    enum: ['pending', 'hired', 'rejected'],
    default: 'pending'
  },
  payment: {
    paid: { type: Boolean, default: false },
    orderId: { type: String, default: null },
    paymentId: { type: String, default: null },
    amount: { type: Number, default: null }, // in base currency units
    currency: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    // Split payment fields
    requiresSplit: { type: Boolean, default: false },
    partiallyPaid: { type: Boolean, default: false },
    totalAmount: { type: Number, default: null },
    lastPaymentAt: { type: Date, default: null },
    splitOrders: [{
      orderId: { type: String, required: true },
      amount: { type: Number, required: true },
      paid: { type: Boolean, default: false },
      paymentId: { type: String, default: null },
      verifiedAt: { type: Date, default: null }
    }]
  }
}, {
  timestamps: true
});

// Indexes
bidSchema.index({ gigId: 1, createdAt: -1 }); 
bidSchema.index({ freelancerId: 1 }); 
bidSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true }); 

module.exports = mongoose.model('Bid', bidSchema);