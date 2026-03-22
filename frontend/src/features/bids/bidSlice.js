import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Submit bid
export const submitBid = createAsyncThunk(
  'bids/submitBid',
  async (bidData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/bids', bidData);
      return data.bid;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit bid');
    }
  }
);

// Fetch bids for a gig
export const fetchBidsForGig = createAsyncThunk(
  'bids/fetchBidsForGig',
  async (gigId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/bids/${gigId}`);
      return data.bids;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bids');
    }
  }
);

// Hire bid
export const hireBid = createAsyncThunk(
  'bids/hireBid',
  async (bidId, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/bids/${bidId}/hire`);
      return data.bid;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to hire freelancer');
    }
  }
);

// Fetch user's bids
export const fetchMyBids = createAsyncThunk(
  'bids/fetchMyBids',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/bids/my-bids');
      return data.bids;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your bids');
    }
  }
);

const bidSlice = createSlice({
  name: 'bids',
  initialState: {
    bids: [],
    myBids: [],
    isLoading: false,
    error: null,
    success: null
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.success = null;
    }
  },
  extraReducers: (builder) => {
    // Submit bid
    builder.addCase(submitBid.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(submitBid.fulfilled, (state, action) => {
      state.isLoading = false;
      state.success = 'Bid submitted successfully!';
      state.myBids.unshift(action.payload);
    });
    builder.addCase(submitBid.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Fetch bids for gig
    builder.addCase(fetchBidsForGig.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchBidsForGig.fulfilled, (state, action) => {
      state.isLoading = false;
      state.bids = action.payload;
    });
    builder.addCase(fetchBidsForGig.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Hire bid
    builder.addCase(hireBid.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(hireBid.fulfilled, (state, action) => {
      state.isLoading = false;
      state.success = 'Freelancer hired successfully!';
      // Update bid statuses in local state for this gig
      const hiredBid = action.payload;
      const gigId =
        hiredBid.gigId && typeof hiredBid.gigId === 'object'
          ? hiredBid.gigId._id
          : hiredBid.gigId;

      state.bids = state.bids.map((bid) => {
        if (bid._id === hiredBid._id) {
          return hiredBid;
        }

        if (gigId && bid.gigId?.toString?.() === gigId.toString() && bid.status === 'pending') {
          return { ...bid, status: 'rejected' };
        }

        return bid;
      });
    });
    builder.addCase(hireBid.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Fetch my bids
    builder.addCase(fetchMyBids.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchMyBids.fulfilled, (state, action) => {
      state.isLoading = false;
      state.myBids = action.payload;
    });
    builder.addCase(fetchMyBids.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  }
});

export const { clearMessages } = bidSlice.actions;
export default bidSlice.reducer;