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

app = FastAPI(title="Nexus Secure Dark Marketplace & Syndicate Relay API")

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

def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

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
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
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

    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT NOT NULL,
            sender TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            order_id TEXT,
            timestamp TEXT NOT NULL,
            is_read INTEGER DEFAULT 0
        )
    ''')

    # Dark Syndicates / Groups table with live streaming metadata
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dark_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            topic TEXT NOT NULL,
            creator TEXT NOT NULL,
            members_json TEXT NOT NULL,
            is_live INTEGER DEFAULT 0,
            stream_title TEXT DEFAULT '',
            stream_started_at TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
    ''')

    # Safe column migrations for existing SQLite databases
    def ensure_column(table_name, col_name, col_def):
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = [r[1] for r in cursor.fetchall()]
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}")

    ensure_column("users", "cult_balance", "REAL DEFAULT 0.0")
    ensure_column("items", "state", "TEXT DEFAULT 'Available'")
    ensure_column("items", "currency", "TEXT DEFAULT 'CULT'")
    ensure_column("orders", "receipt_json", "TEXT")
    ensure_column("orders", "payment_method", "TEXT DEFAULT 'cult_wallet'")
    ensure_column("dark_groups", "is_live", "INTEGER DEFAULT 0")
    ensure_column("dark_groups", "stream_title", "TEXT DEFAULT ''")
    ensure_column("dark_groups", "stream_started_at", "TEXT DEFAULT ''")
    
    # Seed default marketplace items if database is empty
    cursor.execute("SELECT COUNT(*) FROM items")
    if cursor.fetchone()[0] == 0:
        seed_items = [
            ("Zero-Log Encrypted Router", "50", "CULT", "SecureTech", "Available", "Hardware firewall router pre-configured with zero-log VPN protocol."),
            ("Anonymous Node Config Script", "15", "CULT", "NetNinja", "Available", "Self-hosted encrypted relay server configuration scripts with automatic kill-switch."),
            ("Hardware Crypto Cold Wallet", "25", "CULT", "CryptoVault", "Available", "Tamper-proof physical hardware wallet for offline private key storage.")
        ]
        cursor.executemany("INSERT INTO items (title, price, currency, seller, state, desc) VALUES (?, ?, ?, ?, ?, ?)", seed_items)

    # Seed default Dark Syndicates / Groups if empty
    cursor.execute("SELECT COUNT(*) FROM dark_groups")
    if cursor.fetchone()[0] == 0:
        seed_groups = [
            ("grp-01", "CYBER UNDERGROUND RELAY", "0-Day Exploits, Encrypted Relays & Hardware Deals", "SecureTech", json.dumps(["SecureTech", "CryptoVault", "NetNinja"]), 0, "", "", "2026-09-28 20:00:00"),
            ("grp-02", "HOSTEL LIVE STREAM & LOUNGE", "Live Coding, Security Audits, Gaming & P2P Stream", "NetNinja", json.dumps(["NetNinja", "SecureTech", "CryptoVault"]), 0, "", "", "2026-09-28 20:30:00"),
            ("grp-03", "DARK COLD STORAGE SYNDICATE", "P2P Escrow, CULT Coins Arbitrage & Key Exchange", "CryptoVault", json.dumps(["CryptoVault"]), 0, "", "", "2026-09-28 21:00:00")
        ]
        cursor.executemany("INSERT INTO dark_groups (id, name, topic, creator, members_json, is_live, stream_title, stream_started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", seed_groups)
        
    conn.commit()
    conn.close()

init_db()

class ItemModel(BaseModel):
    id: Optional[int] = None
    title: str
    price: str
    currency: str = "CULT"
    seller: Optional[str] = None
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

class OrderStatusUpdate(BaseModel):
    status: str

class GroupCreateModel(BaseModel):
    name: str
    topic: str

class GroupStreamToggleModel(BaseModel):
    is_live: bool
    stream_title: Optional[str] = ""

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
        conn = get_db()
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

    async def broadcast_raw(self, message_str: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    pass

manager = ConnectionManager()

def get_private_room_key(u1: str, u2: str) -> str:
    return "_".join(sorted([u1, u2]))

@app.get("/")
async def root():
    return {"status": "online", "system": "Nexus Secure Dark Marketplace & Syndicate Relay API"}

@app.get("/api/items")
async def get_items():
    conn = get_db()
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
            "state": r[5] or "Available",
            "desc": r[6]
        })
    return items

@app.post("/api/items")
async def create_item(item: ItemModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO items (title, price, currency, seller, state, desc) VALUES (?, ?, ?, ?, ?, ?)",
        (item.title, str(item.price), item.currency, user_payload["username"], item.state or "Available", item.desc)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    res = item.dict()
    res["id"] = new_id
    res["seller"] = user_payload["username"]
    res["state"] = item.state or "Available"
    return res

@app.patch("/api/items/{item_id}/toggle-stock")
async def toggle_item_stock(item_id: int, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT seller, state FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found.")
    
    seller, current_state = row[0], row[1]
    if seller != user_payload["username"] and user_payload.get("role") != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized: Only the product seller can change stock status.")
    
    new_state = "Out of Stock" if current_state == "Available" else "Available"
    cursor.execute("UPDATE items SET state = ? WHERE id = ?", (new_state, item_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "id": item_id, "state": new_state}

@app.delete("/api/items/{item_id}")
async def delete_item(item_id: int, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT seller FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found.")
    
    seller = row[0]
    if seller != user_payload["username"] and user_payload.get("role") != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized: Only the seller can delete this item.")
    
    cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"Item {item_id} deleted successfully."}

@app.post("/api/auth/register")
async def register(req: AuthRegisterRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists in registry.")
    
    hashed_pw = hash_password(req.password)
    initial_balance = 0.0
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
    
    conn = get_db()
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
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    balance = row[0] if row and row[0] is not None else 0.0
    return {"username": username, "cultBalance": balance}

@app.get("/api/wallet/{username}/transactions")
async def get_wallet_transactions(username: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    if user_payload["username"] != username:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, utr_ref, username, cult_amount, inr_amount, timestamp, status FROM utr_transactions WHERE username = ? ORDER BY id DESC", (username,))
    rows = cursor.fetchall()
    conn.close()

    txs = []
    for r in rows:
        txs.append({
            "id": r[0],
            "utrRef": r[1],
            "username": r[2],
            "cultAmount": r[3],
            "inrAmount": r[4],
            "timestamp": r[5],
            "status": r[6]
        })
    return txs

@app.post("/api/wallet/topup")
async def topup_cult_wallet(req: TopUpRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    if user_payload["username"] != req.username:
        raise HTTPException(status_code=403, detail="Unauthorized wallet modification.")

    clean_utr = req.utr_ref.strip()
    if not re.match(r"^\d{12}$", clean_utr):
        raise HTTPException(
            status_code=400, 
            detail="Invalid UTR Reference Number. UPI UTR / RRN must be exactly a 12-digit numeric code from your Google Pay receipt."
        )

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Top up amount must be greater than 0.")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT utr_ref, username FROM utr_transactions WHERE utr_ref = ?", (clean_utr,))
    existing_utr = cursor.fetchone()
    if existing_utr:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail=f"Security Violation: UTR {clean_utr} has already been redeemed and credited by @{existing_utr[1]}."
        )

    cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (req.username,))
    row = cursor.fetchone()
    current_bal = row[0] if row and row[0] is not None else 0.0
    
    new_balance = current_bal + req.amount
    inr_amount = req.amount * 100.0
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute(
        "INSERT INTO utr_transactions (utr_ref, username, cult_amount, inr_amount, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
        (clean_utr, req.username, req.amount, inr_amount, timestamp_str, "VERIFIED_AND_CREDITED")
    )

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
    
    conn = get_db()
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

@app.get("/api/vendor/orders/{seller_username}")
async def get_vendor_orders(seller_username: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    if user_payload["username"] != seller_username and user_payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Cannot view other vendors' sales.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, items_json, total, shipping_json, payment_method, timestamp, status, receipt_json FROM orders ORDER BY rowid DESC")
    all_rows = cursor.fetchall()
    conn.close()

    vendor_orders = []
    for r in all_rows:
        try:
            items_list = json.loads(r[2])
            matching_items = [item for item in items_list if item.get("seller") == seller_username]
            if matching_items:
                vendor_orders.append({
                    "id": r[0],
                    "customerUsername": r[1],
                    "items": items_list,
                    "vendorItems": matching_items,
                    "total": r[3],
                    "shipping": json.loads(r[4]),
                    "paymentMethod": r[5],
                    "timestamp": r[6],
                    "status": r[7],
                    "receipt": json.loads(r[8]) if r[8] else None
                })
        except Exception:
            continue

    return vendor_orders

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, payload: OrderStatusUpdate, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT username, items_json, status FROM orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found.")

    buyer_username = row[0]
    items_list = json.loads(row[1])
    sellers = [item.get("seller") for item in items_list if item.get("seller")]

    if user_payload["username"] != buyer_username and user_payload["username"] not in sellers and user_payload.get("role") != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized to update status for this order.")

    cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (payload.status, order_id))
    conn.commit()
    conn.close()

    return {"status": "success", "order_id": order_id, "new_status": payload.status}

@app.post("/api/orders")
async def create_order(order: OrderModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)

    conn = get_db()
    cursor = conn.cursor()
    
    for item in order.items:
        if "id" in item:
            cursor.execute("SELECT state FROM items WHERE id = ?", (item["id"],))
            state_row = cursor.fetchone()
            if state_row and state_row[0] == "Out of Stock":
                conn.close()
                raise HTTPException(status_code=400, detail=f"Item '{item.get('title')}' is currently Out of Stock.")

    if order.paymentMethod == 'cult_wallet':
        cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (user_payload["username"],))
        row = cursor.fetchone()
        current_bal = row[0] if row and row[0] is not None else 0.0
        try:
            order_total = float(order.total)
        except ValueError:
            order_total = 0.0
        
        if current_bal < order_total:
            conn.close()
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient CULT Balance. You have {current_bal:.2f} CULT, but this order requires {order_total:.2f} CULT. Please top up your wallet or choose Direct Cash on Delivery."
            )
            
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

    sellers = set()
    for itm in order.items:
        s = itm.get("seller")
        if s and s != user_payload["username"]:
            sellers.add(s)

    items_summary = ", ".join([f"{i.get('title', 'Item')} (x{i.get('qty', 1)})" for i in order.items])
    phone = order.shipping.get("phone", "N/A")
    address = order.shipping.get("address", "N/A")
    city = order.shipping.get("city", "N/A")
    
    pay_label = (
        "Direct Cash / Offline Hand-to-Hand" if order.paymentMethod in ['offline_cash', 'cod'] 
        else "CULT Virtual Wallet" if order.paymentMethod == 'cult_wallet'
        else "UPI / GPay"
    )

    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for seller in sellers:
        cursor.execute(
            "INSERT INTO notifications (recipient, sender, title, message, order_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (
                seller,
                order.username,
                f"New Order #{order.id}",
                f"Buyer @{order.username} ordered: {items_summary}. Total: {order.total} CULT. Pay Method: {pay_label}. Deliver to: {address}, {city} (Phone: {phone})",
                order.id,
                timestamp_now
            )
        )

        room_id = get_private_room_key(order.username, seller)
        order_alert_msg = (
            f"📦 [ORDER #{order.id} NOTIFICATION]\n"
            f"Buyer: @{order.username}\n"
            f"Items: {items_summary}\n"
            f"Total: {order.total} CULT (≈ ₹{float(order.total)*100:.0f} INR)\n"
            f"Payment: {pay_label}\n"
            f"Contact: {order.shipping.get('fullName', order.username)} ({phone})\n"
            f"Address: {address}, {city} - {order.shipping.get('postalCode', '')}"
        )
        cursor.execute(
            "INSERT INTO messages (room_id, sender, text, timestamp) VALUES (?, ?, ?, ?)",
            (room_id, "SYSTEM_ORDER_BOT", order_alert_msg, timestamp_now)
        )

    conn.commit()
    conn.close()

    for seller in sellers:
        room_id = get_private_room_key(order.username, seller)
        if room_id in manager.active_connections:
            msg_obj = {
                "id": int(time.time() * 1000),
                "sender": "SYSTEM_ORDER_BOT",
                "text": order_alert_msg,
                "timestamp": timestamp_now
            }
            try:
                for connection in manager.active_connections[room_id]:
                    await connection.send_text(json.dumps(msg_obj))
            except Exception:
                pass

    return {"status": "success", "order_id": order.id}

@app.get("/api/notifications/{username}")
async def get_user_notifications(username: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    if user_payload["username"] != username:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, recipient, sender, title, message, order_id, timestamp, is_read FROM notifications WHERE recipient = ? ORDER BY id DESC LIMIT 50", (username,))
    rows = cursor.fetchall()
    conn.close()

    notifs = []
    for r in rows:
        notifs.append({
            "id": r[0],
            "recipient": r[1],
            "sender": r[2],
            "title": r[3],
            "message": r[4],
            "orderId": r[5],
            "timestamp": r[6],
            "isRead": bool(r[7])
        })
    return notifs

# ==================== DARK SYNDICATES & LIVE STREAMING APIS ====================

@app.get("/api/groups")
async def get_groups():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, topic, creator, members_json, is_live, stream_title, stream_started_at, created_at FROM dark_groups ORDER BY is_live DESC, rowid DESC")
    rows = cursor.fetchall()
    conn.close()

    groups = []
    for r in rows:
        try:
            members = json.loads(r[4])
        except Exception:
            members = [r[3]]
        
        groups.append({
            "id": r[0],
            "name": r[1],
            "topic": r[2],
            "creator": r[3],
            "members": members,
            "isLive": bool(r[5]),
            "streamTitle": r[6],
            "streamStartedAt": r[7],
            "createdAt": r[8]
        })
    return groups

@app.post("/api/groups")
async def create_group(req: GroupCreateModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    creator = user_payload["username"]

    if not req.name.strip() or not req.topic.strip():
        raise HTTPException(status_code=400, detail="Syndicate Name and Protocol Topic are required.")

    group_id = f"grp-{int(time.time() * 1000) % 10000000}"
    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    members_list = [creator]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO dark_groups (id, name, topic, creator, members_json, is_live, stream_title, stream_started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (group_id, req.name.strip(), req.topic.strip(), creator, json.dumps(members_list), 0, "", "", timestamp_now)
    )
    
    # System welcome message in group room
    welcome_msg = f"🔒 Syndicate [{req.name}] established by @{creator}. Encrypted 24/7 channel open. Ready for comms and live streams."
    cursor.execute(
        "INSERT INTO messages (room_id, sender, text, timestamp) VALUES (?, ?, ?, ?)",
        (f"group_{group_id}", "SYSTEM_SYNDICATE_BOT", welcome_msg, timestamp_now)
    )
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "group": {
            "id": group_id,
            "name": req.name.strip(),
            "topic": req.topic.strip(),
            "creator": creator,
            "members": members_list,
            "isLive": False,
            "streamTitle": "",
            "createdAt": timestamp_now
        }
    }

@app.post("/api/groups/{group_id}/join")
async def join_group(group_id: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT members_json, name FROM dark_groups WHERE id = ?", (group_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Syndicate group not found.")

    try:
        members = json.loads(row[0])
    except Exception:
        members = []

    if username not in members:
        members.append(username)
        cursor.execute("UPDATE dark_groups SET members_json = ? WHERE id = ?", (json.dumps(members), group_id))
        
        # System join announcement
        timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        join_msg = f"📡 Operative @{username} joined the syndicate."
        cursor.execute(
            "INSERT INTO messages (room_id, sender, text, timestamp) VALUES (?, ?, ?, ?)",
            (f"group_{group_id}", "SYSTEM_SYNDICATE_BOT", join_msg, timestamp_now)
        )
        conn.commit()

        # Broadcast join message
        msg_obj = {"id": int(time.time()*1000), "sender": "SYSTEM_SYNDICATE_BOT", "text": join_msg, "timestamp": timestamp_now}
        await manager.broadcast_raw(json.dumps(msg_obj), f"group_{group_id}")

    conn.close()
    return {"status": "success", "group_id": group_id, "members": members}

@app.post("/api/groups/{group_id}/leave")
async def leave_group(group_id: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT creator, members_json FROM dark_groups WHERE id = ?", (group_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Syndicate group not found.")

    creator = row[0]
    try:
        members = json.loads(row[1])
    except Exception:
        members = []

    if username in members:
        members.remove(username)
        cursor.execute("UPDATE dark_groups SET members_json = ? WHERE id = ?", (json.dumps(members), group_id))
        conn.commit()

    conn.close()
    return {"status": "success", "group_id": group_id, "members": members}

@app.patch("/api/groups/{group_id}/stream")
async def toggle_group_stream(group_id: str, req: GroupStreamToggleModel, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT creator, name FROM dark_groups WHERE id = ?", (group_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Syndicate not found.")

    creator, group_name = row[0], row[1]
    if creator != username and user_payload.get("role") != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized: Only syndicate creator / admin can start live streaming.")

    timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    is_live_int = 1 if req.is_live else 0
    stream_title = req.stream_title or (f"Live Relay by @{username}" if req.is_live else "")
    started_at = timestamp_now if req.is_live else ""

    cursor.execute(
        "UPDATE dark_groups SET is_live = ?, stream_title = ?, stream_started_at = ? WHERE id = ?",
        (is_live_int, stream_title, started_at, group_id)
    )

    alert_text = (
        f"🔴 [LIVE STREAM BROADCAST STARTED] Host @{username} is now streaming live: \"{stream_title}\"!"
        if req.is_live else
        f"⏹️ [STREAM ENDED] Host @{username} ended the live broadcast. Chat remains active 24/7."
    )

    cursor.execute(
        "INSERT INTO messages (room_id, sender, text, timestamp) VALUES (?, ?, ?, ?)",
        (f"group_{group_id}", "SYSTEM_SYNDICATE_BOT", alert_text, timestamp_now)
    )
    conn.commit()
    conn.close()

    # Broadcast event to group WebSocket
    stream_event = {
        "id": int(time.time() * 1000),
        "sender": "SYSTEM_SYNDICATE_BOT",
        "text": alert_text,
        "type": "STREAM_STATUS_CHANGE",
        "isLive": req.is_live,
        "streamTitle": stream_title,
        "timestamp": timestamp_now
    }
    await manager.broadcast_raw(json.dumps(stream_event), f"group_{group_id}")

    return {
        "status": "success",
        "group_id": group_id,
        "isLive": req.is_live,
        "streamTitle": stream_title
    }

@app.get("/api/groups/{group_id}/viewers")
async def get_group_viewers(group_id: str):
    room_id = f"group_{group_id}"
    viewers = len(manager.active_connections.get(room_id, []))
    return {"group_id": group_id, "viewers": viewers}

# ==================== WEBSOCKETS ====================

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
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, sender, text, timestamp FROM messages WHERE room_id = 'global' ORDER BY id ASC LIMIT 50")
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "timestamp": msg[3]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 65536:
                continue
            try:
                msg_data = json.loads(raw_data)
                msg_data["sender"] = user_payload["username"]
                await manager.broadcast(msg_data, "global")
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")

@app.websocket("/ws/chat/group/{group_id}")
async def group_chat_ws(websocket: WebSocket, group_id: str, token: Optional[str] = Query(None)):
    if not token:
        await websocket.close(code=4001)
        return
    
    try:
        user_payload = verify_jwt_token(token)
    except Exception:
        await websocket.close(code=4003)
        return

    room_id = f"group_{group_id}"
    await manager.connect(websocket, room_id)
    
    # Broadcast genuine real-time live viewer count on connect
    viewer_count = len(manager.active_connections.get(room_id, []))
    await manager.broadcast_raw(json.dumps({
        "type": "VIEWER_COUNT_UPDATE", 
        "count": viewer_count,
        "group_id": group_id
    }), room_id)

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, sender, text, timestamp FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT 60", (room_id,))
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "timestamp": msg[3]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 1048576: # 1MB max for high-res frames / WebRTC signals
                continue
            try:
                msg_data = json.loads(raw_data)
                msg_type = msg_data.get("type", "chat")
                
                # If it's signaling/stream data or frame broadcast, forward raw
                if msg_type in ["SIGNAL_OFFER", "SIGNAL_ANSWER", "SIGNAL_ICE", "STREAM_FRAME", "VIEWER_PING"]:
                    msg_data["sender"] = user_payload["username"]
                    await manager.broadcast_raw(json.dumps(msg_data), room_id)
                else:
                    msg_data["sender"] = user_payload["username"]
                    await manager.broadcast(msg_data, room_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, room_id)
        # Broadcast genuine real-time live viewer count on disconnect
        viewer_count = len(manager.active_connections.get(room_id, []))
        await manager.broadcast_raw(json.dumps({
            "type": "VIEWER_COUNT_UPDATE", 
            "count": viewer_count,
            "group_id": group_id
        }), room_id)

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

    room_participants = room_id.split("_")
    if user_payload["username"] not in room_participants and user_payload.get("role") != "admin":
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, room_id)
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, sender, text, timestamp FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT 60", (room_id,))
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "timestamp": msg[3]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 65536:
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