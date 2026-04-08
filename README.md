# Taskvra

Taskvra is a full-stack MERN freelance marketplace where clients post gigs, freelancers submit bids, and hiring, messaging, and payments happen in real time.

## Features

- JWT auth with HttpOnly cookies
- Email verification flow
- Gig posting and search
- Bid workflow with role restrictions
- Single-hire protection per gig
- Real-time chat and notifications (Socket.io)
- Razorpay payment verification
- Public profiles with ratings

## Tech Stack

### Frontend
- React 18 (Vite)
- Redux Toolkit
- React Router v6
- Axios
- Tailwind CSS

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- Socket.io
- multer + Cloudinary
- Nodemailer

## Project Structure

```text
taskvra/
	backend/
	frontend/
	docs/
	README.md
```

## Quick Start

### 1) Clone and install

```bash
git clone https://github.com/Abhibharti0/Taskvra--Freelacing-App.git
cd Taskvra--Freelacing-App

cd backend
npm install

cd ../frontend
npm install
```

### 2) Environment files

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/taskvra
JWT_SECRET=replace_with_strong_secret

RAZORPAY_KEY_ID=replace_with_key
RAZORPAY_KEY_SECRET=replace_with_secret
RAZORPAY_CURRENCY=INR

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=no-reply@taskvra.local

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GROQ_API_KEY=
GROQ_MODEL=mixtral-8x7b-32768
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=replace_with_key
```

### 3) Run

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## GitHub Push (Safe)

Before push, confirm secrets are not tracked:

```bash
git status --short --branch
git ls-files | findstr /R "\.env$ \.env\."
```

If any env file appears, untrack it:

```bash
git rm --cached backend/.env frontend/.env
```

Push commands:

```bash
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/Abhibharti0/Taskvra--Freelacing-App.git
git push -u origin main
```

If `origin` already exists:

```bash
git remote set-url origin https://github.com/Abhibharti0/Taskvra--Freelacing-App.git
git push -u origin main
```

## Security Notes

- Do not push `backend/.env` or `frontend/.env`
- Do not push API keys, tokens, or private credential files
- Keep `.venv/` local only
- Rotate keys immediately if exposed

## Deployment (Render + Vercel)

### Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Required env vars:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=your_mongodb_uri
JWT_SECRET=strong_random_secret

# Vercel frontend URL (single origin)
CLIENT_URL=https://your-frontend.vercel.app

# Optional: multiple allowed origins (comma-separated)
# CLIENT_URLS=https://your-frontend.vercel.app,https://www.yourdomain.com

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_CURRENCY=INR

SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_SECURE=false
SMTP_FROM=no-reply@yourdomain.com

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

GROQ_API_KEY=...
GROQ_MODEL=mixtral-8x7b-32768
```

### Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Required env vars:

```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_RAZORPAY_KEY_ID=your_public_razorpay_key
```

### Cookie/CORS notes

- Production cookie mode is `Secure` + `SameSite=None` for cross-site auth between Vercel and Render.
- Ensure `CLIENT_URL` exactly matches your Vercel domain.
- If using custom domain + Vercel preview URLs, add all required origins in `CLIENT_URLS`.

## Flow Summary

### Payment
- Client hires freelancer
- Client creates Razorpay order for hired bid
- Backend verifies signature and marks payment paid

### Messaging
- Conversation auto-created on hire
- Message supports text and attachments
- Unread counts auto-maintained
- Real-time events emitted via Socket.io

