# Enhanced Conversation System

## Overview

The messaging system now has **improved conversation management** that separates and organizes messages between users based on:
- **Gig** (project)
- **Client** (gig owner)
- **Freelancer** (bid creator)
- **Bid** (unique conversation per hired bid)

This makes it easy to track, retrieve, and manage conversations without mixing messages.

---

## Key Features

### 1. **Automatic Conversation Separation**
- Each hired bid creates a **unique conversation**
- Messages are stored separately per conversation
- No mixing of messages from different projects

### 2. **Fast Retrieval with Cached Data**
Each conversation stores:
- ✅ **Gig title** - Know what project the chat is about
- ✅ **Client name** - Client's name cached for quick display
- ✅ **Freelancer name** - Freelancer's name cached for quick display
- ✅ **Last message preview** - See the last message without loading all messages
- ✅ **Unread counts** - Separate counts for client and freelancer
- ✅ **Timestamps** - When the conversation was created and last updated

### 3. **Search & Filter Conversations**
Find conversations easily by:
- **Gig title** - Search by project name
- **Participant name** - Search by client or freelancer name
- **Status** - Filter by active, closed, or archived
- **Gig ID** - Get all conversations for a specific gig

### 4. **Conversation Status Management**
- `active` - Currently active conversation
- `closed` - Completed/closed conversation
- `archived` - Archived for record-keeping

---

## API Endpoints

### 🔷 Get All Conversations
```http
GET /api/messages/conversations?search=keyword&status=active&gigId=xxx
```
**Query Parameters:**
- `search` (optional) - Search by gig title or participant names
- `status` (optional) - Filter by status: active, closed, archived
- `gigId` (optional) - Filter by specific gig

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "conv123",
      "gigTitle": "Build E-commerce Website",
      "clientName": "John Doe",
      "freelancerName": "Jane Smith",
      "lastMessage": "When can you start?",
      "lastMessageAt": "2026-02-17T10:30:00Z",
      "myUnreadCount": 2,
      "myRole": "client",
      "otherParticipant": {
        "_id": "user456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "profilePhoto": "...",
        "role": "freelancer"
      },
      "status": "active",
      "gigId": { "_id": "gig789", "title": "Build E-commerce Website" }
    }
  ]
}
```

---

### 🔷 Get Conversation Summary
```http
GET /api/messages/conversations/summary
```
Get overview stats for current user.

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalConversations": 15,
    "activeConversations": 8,
    "totalUnread": 12,
    "recentConversations": [...]
  }
}
```

---

### 🔷 Get Single Conversation Details
```http
GET /api/messages/conversation/:conversationId/details
```
Get detailed information about a specific conversation.

**Response:**
```json
{
  "success": true,
  "conversation": {
    "_id": "conv123",
    "gigTitle": "Build E-commerce Website",
    "clientName": "John Doe",
    "freelancerName": "Jane Smith",
    "gigId": {
      "_id": "gig789",
      "title": "Build E-commerce Website",
      "budget": 50000,
      "status": "assigned"
    },
    "bidId": {
      "_id": "bid456",
      "price": 45000,
      "status": "hired"
    },
    "otherParticipant": {...},
    "myUnreadCount": 2,
    "myRole": "client"
  }
}
```

---

### 🔷 Update Conversation Status
```http
PATCH /api/messages/conversation/:conversationId/status
```
Close or archive a conversation.

**Request Body:**
```json
{
  "status": "closed"  // or "active" or "archived"
}
```

---

### 🔷 Get or Create Conversation
```http
POST /api/messages/conversation/bid/:bidId
```
Creates a new conversation when a bid is hired (if doesn't exist).

---

### 🔷 Get Messages in Conversation
```http
GET /api/messages/:conversationId
```
Get all messages in a specific conversation.

---

### 🔷 Send Message
```http
POST /api/messages/:conversationId
```
Send a message (text and/or files) in a conversation.

**Request Body:**
```json
{
  "content": "Hello! When can we start?"
}
```

**With Files:**
```
Form Data:
- content: "Here are the designs"
- files: [file1, file2, ...]
```

---

## Database Schema

### Conversation Model
```javascript
{
  bidId: ObjectId,              // Unique per bid
  gigId: ObjectId,              // Reference to gig
  clientId: ObjectId,           // Gig owner
  freelancerId: ObjectId,       // Bid creator
  
  // Cached data for fast retrieval
  gigTitle: String,             // No need to populate gig
  clientName: String,           // No need to populate client
  freelancerName: String,       // No need to populate freelancer
  
  lastMessage: String,          // Preview
  lastMessageAt: Date,
  
  clientUnreadCount: Number,
  freelancerUnreadCount: Number,
  
  status: 'active' | 'closed' | 'archived',
  
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  conversationId: ObjectId,     // Links to conversation
  senderId: ObjectId,
  receiverId: ObjectId,
  content: String,
  attachments: [{
    fileName, fileSize, fileType, fileUrl, uploadedAt
  }],
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Benefits

### ✅ **Easy to Find**
- Search by gig title: "Find all messages about website project"
- Search by name: "Find all chats with John"
- Filter by status: "Show only active conversations"

### ✅ **Better Performance**
- No need to populate user/gig data for every query
- Cached names and titles make listing super fast
- Indexed for efficient searching

### ✅ **Clear Organization**
- One conversation per hired bid
- Each conversation clearly shows:
  - What gig it's about
  - Who the client is
  - Who the freelancer is
  - When last message was sent
  - How many unread messages

### ✅ **Better UX**
- Users can see conversation context at a glance
- Easy to identify which project a message is about
- Quick access to other participant's info
- Unread count helps prioritize responses

---

## Example Use Cases

### 1. **Client viewing all their project chats**
```javascript
// GET /api/messages/conversations
// Shows all conversations where user is client
// Each shows: gig title, freelancer name, last message, unread count
```

### 2. **Freelancer searching for a specific project**
```javascript
// GET /api/messages/conversations?search=Websit
// Returns conversations with gig titles matching "Website"
```

### 3. **Archiving completed project chats**
```javascript
// PATCH /api/messages/conversation/123/status
// { "status": "archived" }
// Keeps history but removes from active list
```

### 4. **Getting overview of all chats**
```javascript
// GET /api/messages/conversations/summary
// Shows: total conversations, active count, unread messages
```

---

## Migration Note

⚠️ **For existing conversations without cached names:**

If you have existing conversations in your database, you'll need to run a migration to populate the new fields (`gigTitle`, `clientName`, `freelancerName`).

Create a migration script:
```javascript
// scripts/migrateConversations.js
const Conversation = require('../models/conversation');
const Gig = require('../models/gig');
const User = require('../models/user');

async function migrateConversations() {
  const conversations = await Conversation.find({});
  
  for (const conv of conversations) {
    const gig = await Gig.findById(conv.gigId);
    const client = await User.findById(conv.clientId);
    const freelancer = await User.findById(conv.freelancerId);
    
    conv.gigTitle = gig.title;
    conv.clientName = client.name;
    conv.freelancerName = freelancer.name;
    
    await conv.save();
  }
  
  console.log('Migration complete!');
}
```

---

## Frontend Integration Tips

### Display Conversation List
```javascript
// Fetch conversations
const response = await fetch('/api/messages/conversations', {
  headers: { Authorization: `Bearer ${token}` }
});
const { conversations } = await response.json();

// Display
conversations.map(conv => (
  <ConversationCard
    key={conv._id}
    gigTitle={conv.gigTitle}
    participantName={conv.otherParticipant.name}
    participantPhoto={conv.otherParticipant.profilePhoto}
    lastMessage={conv.lastMessage}
    unreadCount={conv.myUnreadCount}
    timestamp={conv.lastMessageAt}
  />
));
```

### Search Conversations
```javascript
const searchConversations = async (searchText) => {
  const response = await fetch(
    `/api/messages/conversations?search=${encodeURIComponent(searchText)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
};
```

---

## Summary

Your messaging system now has:
✅ **Separate storage** - Each conversation is isolated
✅ **Fast retrieval** - Cached data for quick loading
✅ **Easy searching** - Find by gig, name, or status
✅ **Better organization** - Clear context for every chat
✅ **Full tracking** - Unread counts, timestamps, status

No more confusion about who sent what message in which project! 🎉
