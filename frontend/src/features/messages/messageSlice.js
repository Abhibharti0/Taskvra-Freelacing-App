import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data.conversations;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const getOrCreateConversation = createAsyncThunk(
  'messages/getOrCreateConversation',
  async (bidId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/messages/conversation/bid/${bidId}`);
      return response.data.conversation;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ conversationId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/${conversationId}?page=${page}&limit=50`);
      return {
        conversationId,
        messages: response.data.messages,
        total: response.data.total,
        page: response.data.page
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/messages/${conversationId}`, { content });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCounts: {},
  loading: false,
  error: null,
  messagesLoading: false
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
      state.messages = [];
    },
    addMessage: (state, action) => {
      const { message } = action.payload;
      state.messages.push(message);
    },
    updateConversationLastMessage: (state, action) => {
      const { conversationId, lastMessage, lastMessageAt } = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      if (conversation) {
        conversation.lastMessage = lastMessage;
        conversation.lastMessageAt = lastMessageAt;
      }
    },
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      state.unreadCounts[conversationId] = (state.unreadCounts[conversationId] || 0) + 1;
    },
    resetUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      state.unreadCounts[conversationId] = 0;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get or create conversation
    builder
      .addCase(getOrCreateConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrCreateConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = action.payload;
        // Add to conversations if not already there
        const exists = state.conversations.some(c => c._id === action.payload._id);
        if (!exists) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(getOrCreateConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload.messages;
        // Reset unread count in the relevant conversation locally
        const conv = state.conversations.find(c => c._id === action.payload.conversationId);
        if (conv) {
          // Determine user role from currentConversation if available
          const current = state.currentConversation || conv;
          if (current && current.clientId && current.freelancerId) {
            // We don't have auth here; rely on counts: if one side > 0, zero it
            if (typeof conv.clientUnreadCount === 'number') conv.clientUnreadCount = 0;
            if (typeof conv.freelancerUnreadCount === 'number') conv.freelancerUnreadCount = 0;
          }
        }
        state.unreadCounts[action.payload.conversationId] = 0;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const {
  setCurrentConversation,
  addMessage,
  updateConversationLastMessage,
  incrementUnreadCount,
  resetUnreadCount,
  clearError
} = messageSlice.actions;

export default messageSlice.reducer;
