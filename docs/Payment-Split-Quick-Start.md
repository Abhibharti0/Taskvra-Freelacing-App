# Quick Setup Guide - Split Payment System

## 🚀 Quick Start (5 Minutes)

### Step 1: Update Environment Variables

Add to your `.env` file:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_CURRENCY=INR

# Set your KYC level: basic, standard, or full
RAZORPAY_KYC_LEVEL=basic
```

### Step 2: Restart Backend Server

```bash
cd backend
# Stop the current server (Ctrl+C)
# Start again
node server.js
```

### Step 3: Test the System

#### Test Regular Payment (Within Limit)

1. Create a gig with budget ₹150,000
2. Submit a bid for ₹150,000  
3. Hire the bid
4. Click "Pay Now"
5. ✅ Should show single Razorpay payment popup

#### Test Split Payment (Exceeds Limit)

1. Create a gig with budget ₹400,000
2. Submit a bid for ₹300,000
3. Hire the bid  
4. Click "Pay Now"
5. ✅ Should see error: "Amount exceeds maximum"
6. ✅ Frontend should automatically detect and offer split payment
7. ✅ Complete payment in 2 parts (₹200,000 + ₹100,000)

---

## 📝 Update Frontend (Option 1: Automatic)

Replace your existing payment logic in `BidList.jsx`:

### Find this code:

```jsx
const handlePayNow = async (bid) => {
  try {
    const { data } = await api.post(`/payments/orders/${bid._id}`);
    // ... rest of payment logic
  } catch (err) {
    toast.error(err.response?.data?.message || 'Unable to initiate payment');
  }
};
```

### Replace with:

```jsx
import SplitPaymentHandler from '../payments/SplitPaymentHandler';

// In your component, replace the "Pay Now" button with:
{bid.status === 'hired' && !bid.payment?.paid && (
  <SplitPaymentHandler
    bid={bid}
    user={user}
    onComplete={() => dispatch(fetchBidsForGig(gigId))}
  />
)}
```

That's it! The component handles everything automatically.

---

## 📝 Update Frontend (Option 2: Manual Implementation)

If you prefer to keep your existing UI, add split payment handling to your `handlePayNow` function:

```jsx
const handlePayNow = async (bid) => {
  try {
    const { data } = await api.post(`/payments/orders/${bid._id}`);
    // Regular payment flow
    await processRegularPayment(data);
  } catch (err) {
    // NEW: Check if split is required
    if (err.response?.data?.requiresSplit) {
      await handleSplitPayment(bid, err.response.data);
    } else {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  }
};

// NEW: Add this function
const handleSplitPayment = async (bid, errorData) => {
  const { splitInfo } = errorData;
  
  const message = 
    `Payment of ₹${splitInfo.totalAmount.toLocaleString()} will be split into ${splitInfo.needsSplits} parts:\n` +
    splitInfo.splits.map((amt, i) => `Part ${i + 1}: ₹${amt.toLocaleString()}`).join('\n') +
    `\n\nProceed?`;

  if (!window.confirm(message)) return;

  try {
    const { data } = await api.post(`/payments/split-orders/${bid._id}`);
    // Process each split sequentially
    for (let i = 0; i < data.splits.length; i++) {
      await processSplitPart(bid._id, data.splits[i], data.keyId);
    }
  } catch (err) {
    toast.error('Split payment failed');
  }
};
```

---

## 🧪 Testing Checklist

- [ ] Backend server restarted with new environment variables
- [ ] Can create gigs with high budgets (₹300,000+)
- [ ] Can submit bids with high amounts
- [ ] Regular payment works for amounts ≤ ₹200,000
- [ ] Split payment triggers for amounts > ₹200,000
- [ ] Each split payment part completes successfully
- [ ] Bid marked as "paid" only after all parts complete
- [ ] Payment status endpoint shows correct progress

---

## 🔧 Configuration Options

### Adjust Payment Limits

Edit `backend/config/paymentConfig.js`:

```javascript
limits: {
  testMode: 200000,  // Your test account limit

  liveMode: {
    basic: 200000,    // Adjust based on your KYC
    standard: 500000,
    full: 10000000
  }
}
```

### Change Split Behavior

The system automatically:
- ✅ Detects when split is needed
- ✅ Calculates optimal split amounts
- ✅ Processes payments sequentially
- ✅ Verifies each part individually
- ✅ Marks bid as paid when complete

No manual configuration needed!

---

## 📱 API Endpoints Available

| Endpoint | Purpose |
|----------|---------|
| `POST /api/payments/orders/:bidId` | Create regular payment order |
| `POST /api/payments/verify` | Verify regular payment |
| `POST /api/payments/split-orders/:bidId` | Create split payment orders |
| `POST /api/payments/verify-split` | Verify one split payment part |
| `GET /api/payments/split-status/:bidId` | Get split payment progress |

---

## ⚠️ Important Notes

### Do NOT:
- ❌ Create split orders manually for small amounts
- ❌ Skip the regular payment attempt
- ❌ Process split payments in parallel
- ❌ Allow users to close browser mid-payment

### DO:
- ✅ Always try regular payment first
- ✅ Let the system auto-detect when split is needed
- ✅ Process split payments sequentially
- ✅ Show clear progress to users
- ✅ Handle payment failures gracefully

---

## 🆘 Troubleshooting

### Error: "Amount exceeds maximum"
**Solution**: This is expected! The system will automatically switch to split payment.

### Split payment not triggering
**Check**:
1. Is amount > ₹200,000?
2. Is `RAZORPAY_KYC_LEVEL` set correctly in `.env`?
3. Did you restart the backend server?

### Payment stuck at "Processing..."
**Check**:
1. Are Razorpay credentials correct?
2. Is Razorpay checkout script loaded?
3. Check browser console for errors

### Bid not marked as paid after all parts
**Check**:
1. Were all split payments verified?
2. Check split payment status: `GET /api/payments/split-status/:bidId`
3. Check backend logs for verification errors

---

## 🎯 Next Steps

### For Development:
- Test with various amounts (₹150K, ₹300K, ₹500K)
- Test payment failure scenarios
- Test browser refresh during split payment

### For Production:
1. Complete Razorpay KYC verification
2. Switch to live credentials
3. Update `RAZORPAY_KYC_LEVEL` in `.env`
4. Test with real (small) amounts first

---

## 📞 Support

If you encounter issues:

1. Check backend logs for errors
2. Check browser console for frontend errors
3. Verify Razorpay credentials
4. Test with smaller amounts first
5. Review [Payment-Split-System.md](./Payment-Split-System.md) for detailed documentation

---

## ✅ You're Ready!

Your system can now handle payments of **any amount**, even if they exceed Razorpay limits! 🎉

The split payment system will automatically:
- Detect when splitting is needed
- Break payments into valid chunks
- Process them sequentially
- Track progress
- Complete the transaction

**No manual intervention needed!**
