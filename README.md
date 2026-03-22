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

## Render Deployment (No render.yaml)

Use these settings in Render Web Service:

- Root Directory: leave empty (repo root)
- Build Command: `npm install`
- Start Command: `npm start`

Required environment variables on Render:

- `NODE_ENV=production`
- `PORT` (Render injects this automatically)
- `CLIENT_URL` (your frontend URL)
- `MONGO_URI`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Optional (if used):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GROQ_API_KEY`, `GROQ_MODEL`

## Security Notes

- Do not push `backend/.env` or `frontend/.env`
- Do not push API keys, tokens, or private credential files
- Keep `.venv/` local only
- Rotate keys immediately if exposed

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

