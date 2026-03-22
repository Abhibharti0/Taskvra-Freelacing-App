const express = require('express');

const protect = require('../middleware/authMiddleware'); // ✅ FIX
const upload = require('../config/multer');

const {
  sendMessage,
  getConversationMessages,
  getConversations,
  getOrCreateConversation,
  getConversationDetails,
  updateConversationStatus,
  getConversationSummary
} = require('../controllers/messageController');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all conversations for logged-in user (with search & filters)
router.get('/conversations', getConversations);

// Get conversation summary
router.get('/conversations/summary', getConversationSummary);

// Get or create conversation for a hired bid
router.post('/conversation/bid/:bidId', getOrCreateConversation);

// Get single conversation details
router.get('/conversation/:conversationId/details', getConversationDetails);

// Update conversation status (close/archive)
router.patch('/conversation/:conversationId/status', updateConversationStatus);

// Send message (with optional file upload)
router.post('/:conversationId', upload.array('files', 10), sendMessage);

// Get messages of a conversation
router.get('/:conversationId', getConversationMessages);

module.exports = router;
