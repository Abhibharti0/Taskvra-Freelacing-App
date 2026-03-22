import { useState } from 'react';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

/**
 * SplitPaymentHandler Component
 * 
 * Handles large payments that exceed Razorpay transaction limits
 * by automatically splitting them into multiple smaller payments.
 * 
 * Usage:
 * <SplitPaymentHandler 
 *   bid={bidObject}
 *   user={currentUser}
 *   onComplete={() => refreshBidList()}
 * />
 */
export default function SplitPaymentHandler({ bid, user, onComplete }) {
  const [splitState, setSplitState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });

  // Try regular payment first, fall back to split if needed
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Try regular payment first
      const { data } = await api.post(`/payments/orders/${bid._id}`);
      await processRegularPayment(data);
    } catch (err) {
      // Check if split payment is required
      if (err.response?.data?.requiresSplit) {
        const { splitInfo } = err.response.data;
        await handleSplitPaymentFlow(splitInfo);
      } else {
        toast.error(err.response?.data?.message || 'Payment initiation failed');
        setIsProcessing(false);
      }
    }
  };

  // Process regular (non-split) payment
  const processRegularPayment = async (orderData) => {
    try {
      await loadRazorpayScript();
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Taskvra',
        description: `Payment for gig bid`,
        order_id: orderData.order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              bidId: bid._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment successful! ✅');
            setIsProcessing(false);
            if (onComplete) onComplete();
          } catch (err) {
            toast.error('Payment verification failed');
            setIsProcessing(false);
          }
        },
        theme: { color: '#10b981' }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        const err = response?.error || {};
        toast.error(`Payment failed: ${err.description || 'Unknown error'}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      toast.error('Failed to open payment gateway');
      setIsProcessing(false);
    }
  };

  // Handle split payment flow
  const handleSplitPaymentFlow = async (splitInfo) => {
    // Show confirmation to user
    const message = 
      `This payment of ₹${splitInfo.totalAmount.toLocaleString()} exceeds the maximum limit of ₹${splitInfo.maxLimit.toLocaleString()}.\n\n` +
      `It will be split into ${splitInfo.needsSplits} payments:\n` +
      splitInfo.splits.map((amt, i) => `  Part ${i + 1}: ₹${amt.toLocaleString()}`).join('\n') +
      `\n\nProceed with split payment?`;

    if (!window.confirm(message)) {
      setIsProcessing(false);
      return;
    }

    try {
      // Create split orders
      const { data } = await api.post(`/payments/split-orders/${bid._id}`);
      
      setSplitState({
        bidId: bid._id,
        splits: data.splits,
        currentIndex: 0,
        keyId: data.keyId,
        totalAmount: data.totalAmount
      });

      toast.success(`Payment split created. Starting part 1 of ${data.splits.length}...`);
      
      // Start first payment
      await processSplitPayment(data.splits, 0, data.keyId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create split payments');
      setIsProcessing(false);
    }
  };

  // Process one part of split payment
  const processSplitPayment = async (splits, index, keyId) => {
    if (index >= splits.length) {
      toast.success('All payments completed! ✅');
      setSplitState(null);
      setIsProcessing(false);
      if (onComplete) onComplete();
      return;
    }

    const split = splits[index];

    try {
      await loadRazorpayScript();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || keyId,
        amount: split.amountInMinor,
        currency: split.currency,
        name: 'Taskvra',
        description: `Payment Part ${split.partNumber} of ${split.totalParts}`,
        order_id: split.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        handler: async (response) => {
          try {
            // Verify this part
            const { data } = await api.post('/payments/verify-split', {
              bidId: bid._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              partNumber: split.partNumber
            });

            if (data.allPaid) {
              toast.success('All payments completed successfully! ✅');
              setSplitState(null);
              setIsProcessing(false);
              if (onComplete) onComplete();
            } else {
              toast.success(
                `Part ${split.partNumber} paid ✓ (${data.remainingPayments} remaining)`
              );
              // Update state and process next payment
              setSplitState(prev => ({
                ...prev,
                currentIndex: index + 1
              }));
              
              // Small delay before next payment
              setTimeout(() => {
                processSplitPayment(splits, index + 1, keyId);
              }, 1000);
            }
          } catch (err) {
            toast.error('Payment verification failed');
            setIsProcessing(false);
          }
        },
        theme: { color: '#10b981' }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        const err = response?.error || {};
        toast.error(`Payment part ${split.partNumber} failed: ${err.description || 'Unknown error'}`);
        setIsProcessing(false);
        setSplitState(null);
      });

      rzp.open();
    } catch (err) {
      toast.error('Failed to process payment');
      setIsProcessing(false);
      setSplitState(null);
    }
  };

  // Get payment status
  const checkPaymentStatus = async () => {
    try {
      const { data } = await api.get(`/payments/split-status/${bid._id}`);
      const { payment } = data;
      
      const message = 
        `Payment Status:\n` +
        `Total: ₹${payment.totalAmount.toLocaleString()}\n` +
        `Paid: ₹${payment.paidAmount.toLocaleString()}\n` +
        `Remaining: ₹${payment.remainingAmount.toLocaleString()}\n` +
        `Parts Paid: ${payment.paidParts}/${payment.totalParts}`;

      alert(message);
    } catch (err) {
      toast.error('Failed to fetch payment status');
    }
  };

  // Render payment button
  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={isProcessing || bid.payment?.paid}
        className="inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing 
          ? splitState 
            ? `Processing Part ${splitState.currentIndex + 1}...`
            : 'Processing...'
          : bid.payment?.paid
          ? `Paid ₹${bid.price.toLocaleString()}`
          : `Pay ₹${bid.price.toLocaleString()}`
        }
      </button>

      {/* Show split payment progress */}
      {splitState && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-amber-200">
              Split Payment Progress
            </span>
            <span className="text-amber-300">
              {splitState.currentIndex + 1} / {splitState.splits.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-linear-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{
                width: `${((splitState.currentIndex + 1) / splitState.splits.length) * 100}%`
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Processing part {splitState.currentIndex + 1} of {splitState.splits.length}
          </p>
        </div>
      )}

      {/* Show check status button for partially paid */}
      {bid.payment?.partiallyPaid && (
        <button
          onClick={checkPaymentStatus}
          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Check Payment Status
        </button>
      )}
    </div>
  );
}
