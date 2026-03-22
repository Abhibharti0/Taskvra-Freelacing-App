import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import socketService from '../../services/socket';

// Listen for auth failures from interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth-failed', () => {
    // This will be handled by the auth slice when needed
    console.log('Auth failed event received');
  });
}

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      // Backend now returns requiresVerification + userId; no auth cookie yet
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.errors?.join(', ')
        || error.message 
        || 'Registration failed';
      console.error('Registration error details:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      return rejectWithValue(errorMessage);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      return data; // could be { user } or { requiresVerification, userId }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Verify email code after login step
export const verifyEmailCode = createAsyncThunk(
  'auth/verifyEmailCode',
  async ({ userId, code }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/verify-email', { userId, code });
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
  }
);

// Resend verification code
export const resendVerificationCode = createAsyncThunk(
  'auth/resendVerificationCode',
  async ({ userId, email }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/resend-code', { userId, email });
      return data.message || 'Verification code resent';
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Resend failed');
    }
  }
);

// Get current user
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      // When FormData is passed, axios automatically sets Content-Type to multipart/form-data
      // and removes the default Content-Type header
      const { data } = await api.put('/auth/profile', formData);
      return data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Logout user
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      socketService.disconnect();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    hasCheckedAuth: false,
    // Email verification flow state
    requiresVerification: false,
    pendingUserId: null,
    verificationInfo: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      const payload = action.payload;
      if (payload?.requiresVerification) {
        state.requiresVerification = true;
        state.pendingUserId = payload.userId;
        state.verificationInfo = payload.message || 'Enter the code sent to your email.';
        state.isAuthenticated = false;
        state.user = null;
      } else if (payload?.user) {
        // Fallback if backend still returns user (not expected now)
        state.isAuthenticated = true;
        state.user = payload.user;
        state.hasCheckedAuth = true;
        socketService.connect(payload.user.id);
      } else {
        // Backwards compatibility
        state.isAuthenticated = true;
        state.user = payload;
        state.hasCheckedAuth = true;
        if (payload?.id) socketService.connect(payload.id);
      }
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      const payload = action.payload;
      if (payload?.requiresVerification) {
        state.requiresVerification = true;
        state.pendingUserId = payload.userId;
        state.verificationInfo = payload.message || 'Enter the code sent to your email.';
        state.isAuthenticated = false;
        state.user = null;
      } else if (payload?.user) {
        state.isAuthenticated = true;
        state.user = payload.user;
        state.hasCheckedAuth = true;
        socketService.connect(payload.user.id);
      } else {
        // Backward compatibility when API returns user directly
        state.isAuthenticated = true;
        state.user = payload;
        state.hasCheckedAuth = true;
        if (payload?.id) socketService.connect(payload.id);
      }
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Verify Email Code
    builder.addCase(verifyEmailCode.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyEmailCode.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.requiresVerification = false;
      state.pendingUserId = null;
      state.verificationInfo = null;
      socketService.connect(action.payload.id);
    });
    builder.addCase(verifyEmailCode.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Resend code (no state change on success except helper text)
    builder.addCase(resendVerificationCode.pending, (state) => {
      state.error = null;
    });
    builder.addCase(resendVerificationCode.fulfilled, (state, action) => {
      state.verificationInfo = action.payload;
    });
    builder.addCase(resendVerificationCode.rejected, (state, action) => {
      state.error = action.payload;
    });

    // Get Me
    builder.addCase(getMe.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.hasCheckedAuth = true;
      socketService.connect(action.payload.id);
    });
    builder.addCase(getMe.rejected, (state) => {
      state.isLoading = false;
      // Clear auth state on getMe failure
      // This ensures user is logged out if cookies aren't being sent
      state.isAuthenticated = false;
      state.user = null;
      state.hasCheckedAuth = true; // Mark that we've checked, even if failed
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      // Cookie is cleared by backend on logout
    });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;