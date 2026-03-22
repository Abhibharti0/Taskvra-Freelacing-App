/**
 * Razorpay Payment Configuration
 * 
 * Adjust these limits based on your Razorpay account type
 */

module.exports = {
  // Payment limits based on Razorpay account type
  limits: {
    // Test Mode Limit
    testMode: 200000, // ₹2,00,000

    // Live Mode Limits (adjust based on your KYC level)
    liveMode: {
      basic: 200000,      // ₹2,00,000 (Basic KYC)
      standard: 500000,   // ₹5,00,000 (Standard KYC)
      full: 10000000      // ₹1,00,00,000 (Full KYC)
    }
  },

  // Get current limit based on environment
  getCurrentLimit() {
    const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test');
    
    if (isTestMode) {
      return this.limits.testMode;
    }

    // Adjust this based on your KYC level
    const kycLevel = process.env.RAZORPAY_KYC_LEVEL || 'basic';
    return this.limits.liveMode[kycLevel] || this.limits.liveMode.basic;
  },

  // Check if amount requires split payment
  requiresSplit(amount) {
    const limit = this.getCurrentLimit();
    return Number(amount) > limit;
  },

  // Calculate number of splits needed
  calculateSplits(amount) {
    const limit = this.getCurrentLimit();
    const totalAmount = Number(amount);
    
    if (totalAmount <= limit) {
      return { needsSplit: false, splits: [totalAmount] };
    }

    const splits = [];
    let remaining = totalAmount;

    while (remaining > 0) {
      const split = Math.min(remaining, limit);
      splits.push(split);
      remaining -= split;
    }

    return {
      needsSplit: true,
      splitCount: splits.length,
      splits,
      limit
    };
  },

  // Currency configuration
  currency: {
    default: process.env.RAZORPAY_CURRENCY || 'INR',
    symbols: {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£'
    }
  },

  // Get currency symbol
  getCurrencySymbol(code) {
    return this.currency.symbols[code] || code;
  },

  // Format amount for display
  formatAmount(amount, currencyCode) {
    const code = currencyCode || this.currency.default;
    const symbol = this.getCurrencySymbol(code);
    const num = Number(amount).toLocaleString('en-IN');
    return `${symbol}${num}`;
  }
};
