import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import gigReducer from '../features/gigs/gigSlice';
import bidReducer from '../features/bids/bidSlice';
import messageReducer from '../features/messages/messageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gigs: gigReducer,
    bids: bidReducer,
    messages: messageReducer
  }
});

export default store;