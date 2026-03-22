import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

let notificationId = 0;

// Action creators
const addNotification = (message, type = 'info', duration = 5000) => ({
  type: 'notifications/add',
  payload: {
    id: ++notificationId,
    message,
    notificationType: type,
    duration
  }
});

const removeNotification = (id) => ({
  type: 'notifications/remove',
  payload: id
});

export const useToast = () => {
  const dispatch = useDispatch();

  const toast = useCallback(
    (message, type = 'info', duration = 5000) => {
      if (!message) return;

      const id = notificationId + 1;

      // Add notification
      dispatch(addNotification(message, type, duration));

      // Auto remove after duration
      if (duration !== Infinity) {
        setTimeout(() => {
          dispatch(removeNotification(id));
        }, duration);
      }
    },
    [dispatch]
  );

  return {
    success: (msg, duration) => toast(msg, 'success', duration),
    error: (msg, duration) => toast(msg, 'error', duration),
    warning: (msg, duration) => toast(msg, 'warning', duration),
    info: (msg, duration) => toast(msg, 'info', duration),
    show: toast
  };
};

export default useToast;
