# 🌐 NEXUS DARK - Secure Dark Marketplace, Syndicates & Live Feeds

A decentralized, end-to-end encrypted Dark Web Marketplace and P2P Comms hub featuring:
- **Dark Web Cyberpunk UI**: Obsidian matrix background, scanlines, onion routing status.
- **Secure Marketplace**: CULT coins virtual wallet & Direct Cash on Delivery (COD) to vendor.
- **Google Pay UPI QR & 12-Digit UTR Verification**: Instant anti-replay wallet top-up.
- **Dark Syndicates ("Group Dark")**: Group creation, joining, and 24/7 persistent chat.
- **Host Live Video Streaming**: Broadcast webcam, screen share, or cyber feed with real-time in-stream chat.
- **Vendor Console**: Product inventory, stock toggle (`In Stock` / `Out of Stock`), product deletion, incoming customer order management, and buyer-seller encrypted chat.

---

## 🚀 Deployment Instructions

### 1. Render Deployment (Backend)
- **Repo Root Directory**: `backend` (or uses root `render.yaml`)
- **Runtime**: Python 3.11+
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn secure_backend:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `PORT`: Automatically provided by Render.

### 2. Vercel Deployment (Frontend)
- **Framework Preset**: Vite
- **Root Directory**: `frontend` (or `./` with root `vercel.json`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your Render backend URL (e.g. `https://nexus-secure-backend-68ki.onrender.com`)
  - `VITE_WS_URL`: Your Render WebSocket URL (e.g. `wss://nexus-secure-backend-68ki.onrender.com`)

---

## 🛠️ Local Development

### Run Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn secure_backend:app --host 127.0.0.1 --port 8000 --reload
```

### Run Frontend:
```bash
cd frontend
npm install
npm run dev
```
