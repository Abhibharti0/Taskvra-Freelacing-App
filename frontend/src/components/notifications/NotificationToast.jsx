import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import socketService from '../../services/socket';

export default function NotificationToast({
  message: customMessage,
  type: customType,
  onClose: customOnClose
}) {
  const { user } = useSelector((state) => state.auth);

  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  // Clear active timer safely
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Show notification helper
  const showNotification = useCallback((message, type = 'info', onClose, action = null) => {
    clearTimer();

    setNotification({ message, type, action });

    timerRef.current = setTimeout(() => {
      setNotification(null);
      onClose?.();
    }, 7000); // Longer timeout if there's an action button
  }, [clearTimer]);

  // Socket notifications
  useEffect(() => {
    if (!user) return;

    const hiredHandler = (data) => {
      // Ignore socket toast if custom toast is currently active
      if (customMessage) return;
      
      const action = {
        label: 'Open Messages',
        link: '/messages',
        state: data.bidId ? { bidId: data.bidId } : null
      };
      
      showNotification(
        `${data.message} Click below to start chatting with your client!`, 
        'success', 
        null, 
        action
      );
    };

    socketService.on('hired', hiredHandler);

    return () => {
      socketService.off('hired', hiredHandler);
    };
  }, [user, customMessage, showNotification]);

  // Custom toast
  useEffect(() => {
    if (!customMessage) return;
    showNotification(customMessage, customType || 'info', customOnClose);
  }, [customMessage, customType, customOnClose, showNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  const bgColor = isSuccess
    ? 'border-emerald-500/40 bg-emerald-950/95'
    : isError
    ? 'border-red-500/40 bg-red-950/95'
    : 'border-cyan-500/40 bg-slate-950/95';

  const shadowColor = isSuccess
    ? 'shadow-[0_24px_60px_rgba(16,185,129,0.7)]'
    : isError
    ? 'shadow-[0_24px_60px_rgba(239,68,68,0.7)]'
    : 'shadow-[0_24px_60px_rgba(6,182,212,0.7)]';

  const textColor = isSuccess
    ? 'text-emerald-300'
    : isError
    ? 'text-red-300'
    : 'text-cyan-300';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-2 z-[120] flex justify-center px-4 animate-slide-in"
    >
      <div
        className={`pointer-events-auto flex max-w-md flex-1 items-start gap-3 rounded-2xl border ${bgColor} px-4 py-3 text-xs text-slate-100 ${shadowColor} backdrop-blur-xl`}
      >
        {/* Icon */}
        <div
          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${
            isSuccess
              ? 'bg-emerald-500/15'
              : isError
              ? 'bg-red-500/15'
              : 'bg-cyan-500/15'
          } ${textColor}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isSuccess ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : isError ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h3 className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${textColor}`}>
            {isSuccess ? 'Success' : isError ? 'Error' : 'Notification'}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-100">
            {notification.message}
          </p>
          
          {/* Action Button */}
          {notification.action && (
            <Link
              to={notification.action.link}
              state={notification.action.state}
              onClick={() => {
                clearTimer();
                setNotification(null);
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              💬 {notification.action.label}
            </Link>
          )}
        </div>

        {/* Close button */}
        <button
          aria-label="Close notification"
          onClick={() => {
            clearTimer();
            setNotification(null);
            customOnClose?.();
          }}
          className="ml-1 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
