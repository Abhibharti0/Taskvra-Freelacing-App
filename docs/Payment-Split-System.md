# Payment Split System - Handling Large Payments

## Problem

**Razorpay Transaction Limits:**
- 🧪 **Test Mode**: ₹2,00,000 (₹200,000) per transaction
- 🏦 **Live Mode (Basic KYC)**: ₹2,00,000 (₹200,000) per transaction  
- 🏦 **Live Mode (Standard KYC)**: ₹5,00,000 (₹500,000) per transaction
- 🏦 **Live Mode (Full KYC)**: ₹1,00,00,000 (₹10,00,00,000) per transaction

When a payment exceeds these limits, Razorpay returns:
```
Error: Amount exceeds maximum amount allowed
```

## Solution

The system now supports **automatic payment splitting** for amounts that exceed Razorpay limits.

### How It Works

1. **Detection**: System automatically detects if payment amount exceeds limit
2. **Splitting**: Divides payment into multiple smaller transactions
3. **Sequential Payment**: Client completes payments one by one
4. **Verification**: Each payment is verified individually  
5. **Completion**: Bid marked as paid only after ALL parts are completed

---

## API Endpoints

### 🔷 1. Create Split Payment Orders

```http
POST /api/payments/split-orders/:bidId
Authorization: Bearer {token}
```

**Use when**: Regular payment fails with "Amount exceeds maximum" error

**Response:**
```json
{
  "success": true,
  "message": "Payment split into 2 parts",
  "totalAmount": 300000,
  "splits": [
    {
      "orderId": "order_xyz123",
      "amount": 200000,
      "amountInMinor": 20000000,
      "currency": "INR",
      "partNumber": 1,
      "totalParts": 2
    },
    {
      "orderId": "order_abc456",
      "amount": 100000,
      "amountInMinor": 10000000,
      "currency": "INR",
      "partNumber": 2,
      "totalParts": 2
    }
  ],
  "keyId": "rzp_test_xxxxx",
  "instructions": "Complete 2 payments of the amounts shown..."
}
```

---

### 🔷 2. Verify Split Payment

```http
POST /api/payments/verify-split
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "bidId": "bid123",
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_here",
  "partNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment 1 verified. 1 more payment(s) remaining.",
  "allPaid": false,
  "remainingPayments": 1,
  "totalParts": 2
}
```

**When all parts paid:**
```json
{
  "success": true,
  "message": "All payments completed! Bid fully paid.",
  "allPaid": true,
  "remainingPayments": 0,
  "totalParts": 2
}
```

---

### 🔷 3. Get Split Payment Status

```http
GET /api/payments/split-status/:bidId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "totalAmount": 300000,
    "paidAmount": 200000,
    "remainingAmount": 100000,
    "totalParts": 2,
    "paidParts": 1,
    "remainingParts": 1,
    "fullyPaid": false,
    "splits": [
      {
        "orderId": "order_xyz123",
        "amount": 200000,
        "paid": true,
        "paymentId": "pay_abc456",
        "verifiedAt": "2026-02-17T10:30:00Z"
      },
      {
        "orderId": "order_abc789",
        "amount": 100000,
        "paid": false,
        "paymentId": null,
        "verifiedAt": null
      }
    ]
  }
}
```

---

## Configuration

### Backend Configuration

Edit [`backend/config/paymentConfig.js`](../backend/config/paymentConfig.js):

```javascript
module.exports = {
  limits: {
    testMode: 200000,  // Adjust based on your test account

    liveMode: {
      basic: 200000,    // Basic KYC
      standard: 500000, // Standard KYC  
      full: 10000000    // Full KYC
    }
  }
};
```

### Environment Variables

Add to `.env`:

```bash
# Set your KYC level: basic, standard, or full
RAZORPAY_KYC_LEVEL=basic

# Razorpay credentials
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_CURRENCY=INR
```

---

## Frontend Implementation

### Example: Enhanced BidList Component

```jsx
import { useState } from 'react';
import api from '../../services/api';

const BidList = () => {
  const [splitPaymentState, setSplitPaymentState] = useState(null);

  // Try regular payment first
  const handlePayNow = async (bid) => {
    try {
      const { data } = await api.post(`/payments/orders/${bid._id}`);
      // Regular payment flow...
      processPayment(data);
    } catch (err) {
      // Check if split is needed
      if (err.response?.data?.requiresSplit) {
        handleSplitPayment(bid, err.response.data);
      } else {
        toast.error(err.response?.data?.message || 'Payment failed');
      }
    }
  };

  // Handle split payment
  const handleSplitPayment = async (bid, errorData) => {
    const { splitInfo } = errorData;
    
    // Show user the split info
    const proceed = window.confirm(
      `This payment of ₹${splitInfo.totalAmount} will be split into ${splitInfo.needsSplits} parts:\n` +
      splitInfo.splits.map((amt, i) => `Part ${i + 1}: ₹${amt}`).join('\n') +
      '\n\nProceed with split payment?'
    );

    if (!proceed) return;

    try {
      // Create split orders
      const { data } = await api.post(`/payments/split-orders/${bid._id}`);
      setSplitPaymentState({
        bidId: bid._id,
        splits: data.splits,
        currentPart: 0,
        keyId: data.keyId
      });

      // Start with first payment
      processSplitPayment(0);
    } catch (err) {
      toast.error('Failed to create split payments');
    }
  };

  // Process one split payment
  const processSplitPayment = async (index) => {
    if (!splitPaymentState || index >= splitPaymentState.splits.length) {
      return;
    }

    const split = splitPaymentState.splits[index];
    await loadRazorpayScript();

    const options = {
      key: splitPaymentState.keyId,
      amount: split.amountInMinor,
      currency: split.currency,
      name: 'Taskvra',
      description: `Payment Part ${split.partNumber} of ${split.totalParts}`,
      order_id: split.orderId,
      handler: async (response) => {
        try {
          // Verify this part
          const { data } = await api.post('/payments/verify-split', {
            bidId: splitPaymentState.bidId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            partNumber: split.partNumber
          });

          if (data.allPaid) {
            toast.success('All payments completed! ✅');
            setSplitPaymentState(null);
            // Refresh bid list
          } else {
            toast.success(`Part ${split.partNumber} paid. ${data.remainingPayments} more to go.`);
            // Process next part
            processSplitPayment(index + 1);
          }
        } catch (err) {
          toast.error('Verification failed');
        }
      },
      theme: { color: '#10b981' }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    // Your component JSX...
  );
};
```

---

## Frontend Component (Ready to Use)

Complete React component with split payment support:

**File**: [`frontend/src/components/payments/SplitPaymentHandler.jsx`](../frontend/src/components/payments/SplitPaymentHandler.jsx)

```jsx
// See the implementation in the file above
```

---

## Testing

### Test Case 1: Amount Within Limit

**Bid Price**: ₹150,000  
**Expected**: Regular payment succeeds

```bash
POST /api/payments/orders/bid123
✅ Returns single Razorpay order
```

### Test Case 2: Amount Exceeds Limit

**Bid Price**: ₹300,000 (Limit: ₹200,000)  
**Expected**: Error with split suggestion

```bash
POST /api/payments/orders/bid123  
❌ Returns error with requiresSplit: true
```

```json
{
  "requiresSplit": true,
  "splitInfo": {
    "totalAmount": 300000,
    "needsSplits": 2,
    "splits": [200000, 100000]
  }
}
```

### Test Case 3: Split Payment Flow

```bash
# Step 1: Create split orders
POST /api/payments/split-orders/bid123
✅ Returns 2 orders

# Step 2: Pay first part
# User completes Razorpay checkout for order 1

# Step 3: Verify first part
POST /api/payments/verify-split
✅ Part 1 verified, 1 remaining

# Step 4: Pay second part
# User completes Razorpay checkout for order 2

# Step 5: Verify second part
POST /api/payments/verify-split  
✅ All parts paid, bid marked complete
```

---

## Database Schema Updates

### Bid Model (Updated)

```javascript
payment: {
  paid: Boolean,
  orderId: String,
  paymentId: String,
  amount: Number,
  currency: String,
  verifiedAt: Date,
  
  // New fields for split payments
  requiresSplit: Boolean,
  partiallyPaid: Boolean,
  totalAmount: Number,
  lastPaymentAt: Date,
  splitOrders: [{
    orderId: String,
    amount: Number,
    paid: Boolean,
    paymentId: String,
    verifiedAt: Date
  }]
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Amount exceeds maximum" | Payment > limit | Use split payment endpoint |
| "Order not found in split payments" | Wrong order ID | Check split-status endpoint |
| "Bid already marked as paid" | Duplicate payment attempt | Check payment status first |
| "Invalid payment signature" | Razorpay verification failed | Check credentials |

---

## Best Practices

### ✅ DO

- Always try regular payment first
- Show clear UI for split payment progress
- Allow users to check payment status
- Handle partial payments gracefully
- Show remaining amount clearly

### ❌ DON'T

- Don't expose payment internals to users
- Don't allow multiple browsers for split payments
- Don't proceed without user confirmation
- Don't skip signature verification

---

## Upgrading Your Razorpay Account

### To avoid split payments, upgrade your account:

1. **Login to Razorpay Dashboard**  
   https://dashboard.razorpay.com/

2. **Complete KYC Verification**
   - Go to Settings → Payment Methods
   - Complete required documents
   - Submit for verification

3. **Levels of KYC:**
   - **Basic**: ₹2,00,000 limit
   - **Standard**: ₹5,00,000 limit  
   - **Full**: ₹1,00,00,000+ limit

4. **Update Environment**
   ```bash
   # In .env
   RAZORPAY_KEY_ID=rzp_live_xxxxx  # Live keys
   RAZORPAY_KEY_SECRET=xxxxx
   RAZORPAY_KYC_LEVEL=full
   ```

---

## Summary

✅ **Automatic Detection**: System detects when split is needed  
✅ **Smart Splitting**: Divides amount into valid chunks  
✅ **Sequential Processing**: One payment at a time  
✅ **Progress Tracking**: Check payment status anytime  
✅ **Safe Verification**: Each part verified individually  
✅ **Fallback Ready**: Works when account limits are low

Now you can accept payments of **any amount**, regardless of Razorpay account limits! 🎉
