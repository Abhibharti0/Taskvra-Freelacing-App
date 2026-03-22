import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch all gigs
export const fetchGigs = createAsyncThunk(
  'gigs/fetchGigs',
  async (searchQuery = '', { rejectWithValue }) => {
    try {
      const url = searchQuery ? `/gigs?search=${searchQuery}` : '/gigs';
      const { data } = await api.get(url);
      return data.gigs;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch gigs');
    }
  }
);

// Create gig
export const createGig = createAsyncThunk(
  'gigs/createGig',
  async (gigData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/gigs', gigData);
      return data.gig;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create gig');
    }
  }
);

// Fetch user's gigs
export const fetchMyGigs = createAsyncThunk(
  'gigs/fetchMyGigs',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/gigs/my-gigs');
      return data.gigs;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your gigs');
    }
  }
);

const gigSlice = createSlice({
  name: 'gigs',
  initialState: {
    gigs: [],
    myGigs: [],
    isLoading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch gigs
    builder.addCase(fetchGigs.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchGigs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.gigs = action.payload;
    });
    builder.addCase(fetchGigs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Create gig
    builder.addCase(createGig.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createGig.fulfilled, (state, action) => {
      state.isLoading = false;
      state.gigs.unshift(action.payload);
      state.myGigs.unshift(action.payload);
    });
    builder.addCase(createGig.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Fetch my gigs
    builder.addCase(fetchMyGigs.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchMyGigs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.myGigs = action.payload;
    });
    builder.addCase(fetchMyGigs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  }
});

export const { clearError } = gigSlice.actions;
export default gigSlice.reducer;
