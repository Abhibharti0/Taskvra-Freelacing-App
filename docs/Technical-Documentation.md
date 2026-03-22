# Taskvra — Technical Documentation

Taskvra is a full‑stack MERN freelance marketplace where clients post gigs and freelancers submit bids. The system includes JWT auth via HttpOnly cookies, atomic hiring logic, real‑time messaging/notifications, file attachments via Cloudinary, and an optional AI assistant.

---

## Overview
- Secure authentication with HttpOnly cookies (no tokens in localStorage)
- Create, browse, search gigs; freelancers place bids
- Single‑hire per gig safeguarded by status updates and uniqueness
- Conversations auto‑created on hire; real‑time chat with unread counts
- File uploads for messages stored in Cloudinary
- Email notifications (hire, verification) via Nodemailer
- AI assistant using Groq SDK (optional)

---

## Repository Structure

```
backend/
  server.js
  package.json
  config/ (db, multer, socket)
  controllers/ (auth, gig, bid, message, ai)
  middleware/ (auth, error, profile upload)
  models/ (user, gig, bid, conversation, message)
  routes/ (auth, gigs, bids, messages, ai)
  utils/ (email, generateToken)
frontend/
  src/
    services/ (api, socket)
    features/ (auth, bids, gigs, messages)
    components/ and pages/
docs/
  Technical-Documentation.md
```

---

## Environment & Configuration

### Backend `.env`
Required for local development:

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/taskvra
JWT_SECRET=your_secret_key

# Optional: SMTP for email (fallback logs to console if missing)
SMTP_HOST=your.smtp.host
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_SECURE=false
SMTP_FROM=no-reply@taskvra.local

# Optional: Cloudinary for file uploads in messages and profile photos
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: AI assistant (Groq SDK)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=mixtral-8x7b-32768
```

Notes:
- `CLIENT_URL` must match the frontend origin for CORS and Socket.io.
- When Cloudinary variables are not set, message attachments will fail; profile uploads also require Cloudinary.
- When SMTP variables are not set, emails are logged to console (no delivery).
- AI assistant is disabled unless `GROQ_API_KEY` is present.

### Frontend `.env`

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Setup & Run

### Backend
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the server (development):
   ```bash
   npm run dev
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Backend Architecture

- `server.js`: Express app with CORS (allows `CLIENT_URL`, 5173/5174), JSON parsing, cookies, static `/uploads`, Socket.io setup, routes, health check, error handling.
- `config/db.js`: Connects to MongoDB (`MONGO_URI`) with event logging and timeouts.
- `config/socket.js`: Initializes Socket.io, manages user/conversation rooms and typing indicators.
- `config/multer.js`: Cloudinary storage for message attachments; filters and size limits.
- `middleware/authMiddleware.js`: Verifies JWT from HttpOnly cookie `token`, attaches `req.user`.
- `middleware/errorHandler.js`: Normalizes common Mongoose and server errors.
- `middleware/upload.js`: Cloudinary storage for profile photos; image‑only filter.
- `utils/generateToken.js`: Signs JWT containing `{ userId }`, sets HttpOnly cookie.
- `utils/email.js`: Nodemailer transporter; falls back to console logging.

### Data Models
- `User`: name, email, hashed password, optional profile photo, role, email verification fields.
- `Gig`: title, description, budget, status (`open`|`assigned`), ownerId, hiredBidId.
- `Bid`: gigId, freelancerId, message, price, status (`pending`|`hired`|`rejected`), unique `(gigId, freelancerId)`.
- `Conversation`: bidId (unique), gigId, clientId, freelancerId, lastMessage(+At), unread counts, status.
- `Message`: conversationId, senderId, receiverId, content or attachments[], `read` flag.

### Core Flows
1. Authentication
   - Register: issues email verification code; does not log in immediately.
   - Login: if not verified → re‑issue code; if verified → set JWT in HttpOnly cookie.
   - Logout: clears the cookie.
   - Update profile: optional image upload to Cloudinary.

2. Gigs & Bids
   - List gigs with optional `?search=`; get gig details.
   - Create gig (auth required, owner is `req.user._id`).
   - Submit bid (auth required, not allowed by owner; gig must be `open`).
   - Hire bid: owner only; sets gig `assigned`, hired bid `hired`, others `rejected`; creates conversation; emits socket and sends email.

3. Messaging
   - Conversations: list for current user; create/get conversation by `bidId` (only if `hired`).
   - Send message: text and/or attachments; updates unread counts; emits `new_message` and `message_notification`.
   - Fetch messages: marks messages as read and resets unread counts for the viewer.

4. Notifications & Presence (Socket.io)
   - User rooms: `join` → `user_${userId}`; broadcast `online_users`.
   - Conversation rooms: `join_conversation` / `leave_conversation` → `conversation_${conversationId}`.
   - Typing events: `typing` / `stop_typing` within conversation room.
   - Hiring: server emits `hired` to freelancer's user room.

5. AI Assistant (optional)
   - `POST /api/ai/chat` with `{ messages: [{ role: 'user'|'assistant'|'system', content }] }`.
   - Filters harmful content; requires `GROQ_API_KEY`; defaults model to `mixtral-8x7b-32768`.

---

## API Endpoints

Base URL: `/api`

### Auth (`/auth`)
- `POST /register` — Create user and send email verification code.
- `POST /login` — Login if verified; otherwise send verification code.
- `POST /verify-email` — Verify code and set cookie.
- `POST /resend-code` — Resend verification code.
- `POST /logout` — Clear session cookie. (auth)
- `GET /me` — Current user profile. (auth)
- `PUT /profile` — Update name/profile photo. (auth, multipart image)

### Gigs (`/gigs`)
- `GET /` — List gigs, `?search=...` optional.
- `GET /:id` — Get gig details.
- `POST /` — Create gig. (auth)
- `GET /my-gigs` — Current user's gigs. (auth)

### Bids (`/bids`)
- `POST /` — Submit bid with `{ gigId, message, price }`. (auth)
- `GET /my-bids` — Bids by current freelancer. (auth)
- `GET /:gigId` — List bids for a gig (owner only). (auth)
- `PATCH /:bidId/hire` — Hire a freelancer for the gig (owner only). (auth)
- `POST /:bidId/resend-email` — Resend hire email (owner or freelancer). (auth)

### Messages (`/messages`)
- `GET /conversations` — List conversations for current user. (auth)
- `POST /conversation/bid/:bidId` — Get or create conversation if bid is hired. (auth)
- `POST /:conversationId` — Send message; supports attachments via multipart (field `files`). (auth)
- `GET /:conversationId` — Fetch messages in conversation; marks read & resets unread counters. (auth)

### AI (`/ai`)
- `POST /chat` — AI assistant response (requires Groq API key).

---

## Frontend Architecture

- Build: Vite + React 18 + Tailwind CSS.
- State: Redux Toolkit slices under `src/features` for `auth`, `gigs`, `bids`, `messages`.
- Routing: React Router v6 with protected routes.
- Services:
  - `src/services/api.js` — Axios instance with `withCredentials`; smart FormData handling; 401 redirects to login.
  - `src/services/socket.js` — Socket.io client; joins user and conversation rooms; exposes `on`, `off`, `emit`.
- UI Components: Authentication, Gig lists/cards, Bid forms/lists, Messaging windows & conversations, Layout elements (Navbar/Footer/ProtectedRoute), ChatBot widget.

---

## Event Names (Socket.io)
- Client emits:
  - `join` → `{ userId }`
  - `join_conversation` → `{ conversationId }`
  - `leave_conversation` → `{ conversationId }`
  - `typing` → `{ conversationId, userId }`
  - `stop_typing` → `{ conversationId }`
- Server emits:
  - `online_users` → `string[] userIds`
  - `new_message` → `{ message }` to `conversation_${id}`
  - `message_notification` → `{ conversationId, senderName, messagePreview }` to `user_${id}`
  - `hired` → `{ message, gigTitle, gigId, bidId }` to `user_${freelancerId}`

---

## Glossary of Important Terms
- JWT: Signed token used for authentication; here stored in an HttpOnly cookie for security.
- HttpOnly Cookie: Browser cookie inaccessible to JavaScript, reducing XSS token theft risk.
- CORS: Cross‑Origin Resource Sharing; backend must allow the frontend origin for credentials.
- REST API: HTTP endpoints that perform CRUD over resources (`auth`, `gigs`, `bids`, `messages`).
- CRUD: Create, Read, Update, Delete operations on data.
- Mongoose: ODM for MongoDB providing schemas and validation.
- Transaction‑Safety: Here achieved via conditional updates/status checks to prevent double hire.
- Socket.io: Real‑time bidirectional communication for presence, notifications, chat.
- Room: Named channel (e.g., `user_${userId}`, `conversation_${id}`) used to scope events.
- Multer: Middleware to handle `multipart/form-data` uploads.
- Cloudinary: Cloud media storage used for file attachments and profile photos.
- Nodemailer: Email sending library; falls back to console logging when SMTP not configured.
- Redux Toolkit Slice: Module containing state, reducers, and async thunks for a feature.
- Vite: Fast build tool and dev server for modern frontends.
- Axios: HTTP client used by the frontend to consume the API.
- Groq SDK: Client library for calling AI chat completions; requires `GROQ_API_KEY`.

---

## Troubleshooting
- Authentication fails or redirects to login:
  - Ensure backend `CLIENT_URL` matches frontend origin and CORS credentials are enabled.
  - Verify cookies are set (HttpOnly) by checking server responses; browser devtools won't show the token value.
  - Confirm `JWT_SECRET` is set and consistent.
- MongoDB connection:
  - Check `MONGO_URI`; ensure MongoDB is running and reachable.
  - See server logs for connection errors.
- File uploads:
  - Ensure Cloudinary `.env` variables; message/profile uploads require them.
  - Verify allowed mimetypes and size limits (50MB for messages, 5MB for profile images).
- Emails:
  - Without SMTP config, emails are logged to console.
  - With SMTP, verify host, port, security, credentials.
- AI chat:
  - Requires `GROQ_API_KEY`; otherwise `/api/ai/chat` returns `501`.
- CORS/socket issues:
  - Match frontend `VITE_SOCKET_URL` to backend origin; backend allows `CLIENT_URL` and localhost 5173/5174.

---

## Quick Start Commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

---

## Security Notes
- Use HttpOnly, `sameSite=lax` cookies to mitigate CSRF and XSS risks in development.
- Do not store tokens in localStorage/sessionStorage.
- Validate and sanitize inputs (Mongoose schema validations are in place).
- Restrict CORS origins to your known frontend domain in production.
