import os
import json
import sqlite3
import uvicorn
import bcrypt
import jwt
import time
import re
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional

app = FastAPI(title="Nexus Secure Marketplace & CULT Relay API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "marketplace.db")
JWT_SECRET = "NEXUS_JWT_SUPER_SECRET_KEY_HOSTEL_2026_SECURITY_TOKEN"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

LOGIN_ATTEMPTS: Dict[str, List[float]] = {}

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please re-authenticate.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid security token.")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users table (initial cult_balance DEFAULT 0.0)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            email TEXT,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL,
            cult_balance REAL DEFAULT 0.0
        )
    ''')
    
    # Marketplace items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price TEXT NOT NULL,
            currency TEXT DEFAULT 'CULT',
            seller TEXT NOT NULL,
            state TEXT DEFAULT 'Available',
            desc TEXT
        )
    ''')
    
    # Chat history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            items_json TEXT NOT NULL,
            total TEXT NOT NULL,
            shipping_json TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL,
            receipt_json TEXT
        )
    ''')

    # UTR verification & transaction table (prevents duplicate UTR replay attacks)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS utr_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            utr_ref TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            cult_amount REAL NOT NULL,
            inr_amount REAL NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    
    # Seed default marketplace items if database is empty
    cursor.execute("SELECT COUNT(*) FROM items")
    if cursor.fetchone()[0] == 0:
        seed_items = [
            ("Zero-Log Encrypted Router", "50", "CULT", "SecureTech", "Available", "Hardware firewall router pre-configured with zero-log VPN protocol."),
            ("Anonymous Node Config Script", "15", "CULT", "NetNinja", "Available", "Self-hosted encrypted relay server configuration scripts with automatic kill-switch."),
            ("Hardware Crypto Cold Wallet", "25", "CULT", "CryptoVault", "Available", "Tamper-proof physical hardware wallet for offline private key storage.")
        ]
        cursor.executemany("INSERT INTO items (title, price, currency, seller, state, desc) VALUES (?, ?, ?, ?, ?, ?)", seed_items)
        
    conn.commit()
    conn.close()

init_db()

class ItemModel(BaseModel):
    id: Optional[int] = None
    title: str
    price: str
    currency: str = "CULT"
    seller: str
    state: str = "Available"
    desc: str

class AuthRegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "buyer"

class AuthLoginRequest(BaseModel):
    username: str
    password: str

class TopUpRequest(BaseModel):
    username: str
    amount: float
    utr_ref: str

class OrderModel(BaseModel):
    id: str
    username: str
    items: List[dict]
    total: str
    shipping: dict
    paymentMethod: str
    timestamp: str
    status: str
    receipt: Optional[dict] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)

    async def broadcast(self, message: dict, room_id: str):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (room_id, sender, text, timestamp) VALUES (?, ?, ?, ?)",
            (room_id, message.get("sender", "System"), message.get("text", ""), message.get("timestamp", ""))
        )
        conn.commit()
        conn.close()

        if room_id in self.active_connections:
            message_str = json.dumps(message)
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    pass

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"status": "online", "system": "Nexus Secure Marketplace & CULT Relay API"}

@app.get("/api/items")
async def get_items():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, price, currency, seller, state, desc FROM items ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "title": r[1],
            "price": r[2],
            "currency": r[3],
            "seller": r[4],
            "state": r[5],
            "desc": r[6]
        })
    return items

@app.post("/api/items")
async def create_item(item: ItemModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO items (title, price, currency, seller, state, desc) VALUES (?, ?, ?, ?, ?, ?)",
        (item.title, item.price, item.currency, user_payload["username"], item.state, item.desc)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    res = item.dict()
    res["id"] = new_id
    res["seller"] = user_payload["username"]
    return res

@app.post("/api/auth/register")
async def register(req: AuthRegisterRequest):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists in registry.")
    
    hashed_pw = hash_password(req.password)
    initial_balance = 0.0  # User starts with 0 CULT coins
    cursor.execute(
        "INSERT INTO users (username, email, hashed_password, role, cult_balance) VALUES (?, ?, ?, ?, ?)",
        (req.username, req.email, hashed_pw, req.role, initial_balance)
    )
    conn.commit()
    conn.close()
    
    token = create_access_token({"username": req.username, "role": req.role, "email": req.email})
    return {
        "status": "success",
        "username": req.username,
        "role": req.role,
        "token": token,
        "cultBalance": initial_balance
    }

@app.post("/api/auth/login")
async def login(req: AuthLoginRequest):
    now = time.time()
    user_attempts = [t for t in LOGIN_ATTEMPTS.get(req.username, []) if now - t < 60]
    if len(user_attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many failed login attempts. Please wait 60 seconds.")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT username, email, hashed_password, role, cult_balance FROM users WHERE username = ?", (req.username,))
    user_row = cursor.fetchone()
    conn.close()
    
    if not user_row or not verify_password(req.password, user_row[2]):
        user_attempts.append(now)
        LOGIN_ATTEMPTS[req.username] = user_attempts
        raise HTTPException(status_code=401, detail="Invalid alias or passphrase.")
    
    LOGIN_ATTEMPTS[req.username] = []
    token = create_access_token({"username": user_row[0], "role": user_row[3], "email": user_row[1]})
    
    return {
        "status": "success",
        "username": user_row[0],
        "email": user_row[1],
        "role": user_row[3],
        "token": token,
        "cultBalance": user_row[4] if len(user_row) > 4 and user_row[4] is not None else 0.0
    }

@app.get("/api/wallet/{username}")
async def get_wallet_balance(username: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    verify_jwt_token(token)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    balance = row[0] if row and row[0] is not None else 0.0
    return {"username": username, "cultBalance": balance}

@app.post("/api/wallet/topup")
async def topup_cult_wallet(req: TopUpRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    if user_payload["username"] != req.username:
        raise HTTPException(status_code=403, detail="Unauthorized wallet modification.")

    # Validate UTR format (Must be exactly 12 numeric digits for standard Indian UPI transactions)
    clean_utr = req.utr_ref.strip()
    if not re.match(r"^\d{12}$", clean_utr):
        raise HTTPException(
            status_code=400, 
            detail="Invalid UTR Reference Number. UPI UTR / RRN must be exactly a 12-digit numeric code from your UPI payment receipt."
        )

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Check if UTR has already been redeemed
    cursor.execute("SELECT utr_ref, username FROM utr_transactions WHERE utr_ref = ?", (clean_utr,))
    existing_utr = cursor.fetchone()
    if existing_utr:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail=f"Security Violation: UTR {clean_utr} has already been redeemed and processed by @{existing_utr[1]}."
        )

    # Fetch current user wallet balance
    cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (req.username,))
    row = cursor.fetchone()
    current_bal = row[0] if row and row[0] is not None else 0.0
    
    new_balance = current_bal + req.amount
    inr_amount = req.amount * 100.0
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Record UTR payment transaction
    cursor.execute(
        "INSERT INTO utr_transactions (utr_ref, username, cult_amount, inr_amount, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
        (clean_utr, req.username, req.amount, inr_amount, timestamp_str, "VERIFIED_AND_CREDITED")
    )

    # Credit wallet
    cursor.execute("UPDATE users SET cult_balance = ? WHERE username = ?", (new_balance, req.username))
    conn.commit()
    conn.close()
    
    topup_receipt = {
        "receiptId": f"TOP-{int(time.time())}",
        "utrRef": clean_utr,
        "username": req.username,
        "cultCredited": req.amount,
        "inrPaid": inr_amount,
        "date": timestamp_str,
        "recipientUPI": "prajjwal5655@okicici",
        "recipientName": "Prajjwal Maurya",
        "status": "Verified & Credited"
    }

    return {
        "status": "success", 
        "username": req.username, 
        "cultBalance": new_balance, 
        "credited": req.amount,
        "receipt": topup_receipt
    }

@app.get("/api/orders/{username}")
async def get_orders(username: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    if user_payload["username"] != username:
        raise HTTPException(status_code=403, detail="Access denied: Cannot fetch order history for another user.")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, items_json, total, shipping_json, payment_method, timestamp, status, receipt_json FROM orders WHERE username = ? ORDER BY rowid DESC", (username,))
    rows = cursor.fetchall()
    conn.close()
    
    orders = []
    for r in rows:
        orders.append({
            "id": r[0],
            "username": r[1],
            "items": json.loads(r[2]),
            "total": r[3],
            "shipping": json.loads(r[4]),
            "paymentMethod": r[5],
            "timestamp": r[6],
            "status": r[7],
            "receipt": json.loads(r[8]) if r[8] else None
        })
    return orders

@app.post("/api/orders")
async def create_order(order: OrderModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if order.paymentMethod == 'cult_wallet':
        cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (user_payload["username"],))
        row = cursor.fetchone()
        current_bal = row[0] if row and row[0] is not None else 0.0
        order_total = float(order.total)
        
        if current_bal < order_total:
            conn.close()
            raise HTTPException(status_code=400, detail=f"Insufficient CULT Balance. You have {current_bal} CULT, but order total is {order_total} CULT.")
            
        new_balance = current_bal - order_total
        cursor.execute("UPDATE users SET cult_balance = ? WHERE username = ?", (new_balance, user_payload["username"]))

    cursor.execute(
        "INSERT INTO orders (id, username, items_json, total, shipping_json, payment_method, timestamp, status, receipt_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            order.id,
            order.username,
            json.dumps(order.items),
            order.total,
            json.dumps(order.shipping),
            order.paymentMethod,
            order.timestamp,
            order.status,
            json.dumps(order.receipt) if order.receipt else None
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order.id}

@app.websocket("/ws/chat/global")
async def global_chat_ws(websocket: WebSocket, token: Optional[str] = Query(None)):
    if not token:
        await websocket.close(code=4001)
        return
    
    try:
        user_payload = verify_jwt_token(token)
    except Exception:
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, "global")
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, sender, text, timestamp FROM messages WHERE room_id = 'global' ORDER BY id ASC LIMIT 50")
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "timestamp": msg[3]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 4096:
                continue
            try:
                msg_data = json.loads(raw_data)
                msg_data["sender"] = user_payload["username"]
                await manager.broadcast(msg_data, "global")
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")

@app.websocket("/ws/chat/private/{room_id}")
async def private_chat_ws(websocket: WebSocket, room_id: str, token: Optional[str] = Query(None)):
    if not token:
        await websocket.close(code=4001)
        return
    
    try:
        user_payload = verify_jwt_token(token)
    except Exception:
        await websocket.close(code=4003)
        return

    if user_payload["username"] not in room_id.split("_"):
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, room_id)
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, sender, text, timestamp FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT 50", (room_id,))
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "timestamp": msg[3]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 4096:
                continue
            try:
                msg_data = json.loads(raw_data)
                msg_data["sender"] = user_payload["username"]
                await manager.broadcast(msg_data, room_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("secure_backend:app", host="0.0.0.0", port=port, reload=False)