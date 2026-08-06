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

app = FastAPI(title="Nexus Secure Marketplace, Group Comms & Audio Vault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "marketplace.db"
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
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            email TEXT,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL,
            cult_balance REAL DEFAULT 0.0,
            is_pro INTEGER DEFAULT 0,
            is_private INTEGER DEFAULT 0,
            avatar_url TEXT DEFAULT ''
        )
    ''')
    
    # Items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price TEXT NOT NULL,
            currency TEXT DEFAULT 'CULT',
            seller TEXT NOT NULL,
            seller_email TEXT DEFAULT '',
            state TEXT DEFAULT 'Available',
            desc TEXT,
            category TEXT DEFAULT 'Hardware'
        )
    ''')
    
    # Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            media_type TEXT DEFAULT 'text',
            media_url TEXT DEFAULT '',
            timestamp TEXT NOT NULL
        )
    ''')
    
    # Groups table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_by TEXT NOT NULL,
            members_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')

    # Group Invites table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id TEXT NOT NULL,
            group_name TEXT NOT NULL,
            invited_user TEXT NOT NULL,
            invited_by TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING'
        )
    ''')

    # Audio & Media Vault table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audio_vault (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            audio_url TEXT NOT NULL,
            doc_url TEXT DEFAULT '',
            category TEXT DEFAULT 'Voice Story',
            desc TEXT,
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
            receipt_json TEXT,
            utr_ref TEXT
        )
    ''')

    # UTR Transactions table
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
    
    # Seed default items if empty
    cursor.execute("SELECT COUNT(*) FROM items")
    if cursor.fetchone()[0] == 0:
        seed_items = [
            ("Zero-Log Encrypted Router", "50", "CULT", "SecureTech", "securetech@nexus.net", "Available", "Hardware firewall router pre-configured with zero-log VPN protocol.", "Hardware"),
            ("Anonymous Node Config Script", "15", "CULT", "NetNinja", "netninja@nexus.net", "Available", "Self-hosted encrypted relay server configuration scripts with automatic kill-switch.", "Privacy & VPN"),
            ("Hardware Crypto Cold Wallet", "25", "CULT", "CryptoVault", "cryptovault@nexus.net", "Available", "Tamper-proof physical hardware wallet for offline private key storage.", "Hardware"),
            ("Custom Mesh Network Node", "35", "CULT", "RadioHack", "radiohack@nexus.net", "Available", "Long-range LoRa mesh node for off-grid hostel communication.", "Hardware"),
            ("Encrypted Web Storage License", "10", "CULT", "CloudShield", "cloudshield@nexus.net", "Available", "100GB decentralized zero-knowledge encrypted cloud storage vault.", "Security Tools")
        ]
        cursor.executemany("INSERT INTO items (title, price, currency, seller, seller_email, state, desc, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", seed_items)

    # Seed Audio Vault if empty
    cursor.execute("SELECT COUNT(*) FROM audio_vault")
    if cursor.fetchone()[0] == 0:
        seed_audio = [
            ("Hostel Radio Episode #1: Cybersecurity Basics", "RadioNinja", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "Podcast", "Discussion on zero-trust networking and hostel Wi-Fi security.", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            ("Midnight Cyber Ambient Track", "NexusAudio", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", "", "Music", "Relaxing lo-fi ambient beats for late-night coding sessions.", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        ]
        cursor.executemany("INSERT INTO audio_vault (title, author, audio_url, doc_url, category, desc, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)", seed_audio)
        
    conn.commit()
    conn.close()

init_db()

class ItemModel(BaseModel):
    id: Optional[int] = None
    title: str
    price: str
    currency: str = "CULT"
    seller: str
    seller_email: Optional[str] = ""
    state: str = "Available"
    desc: str
    category: Optional[str] = "Hardware"

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

class ProUpgradeUtrRequest(BaseModel):
    username: str
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
    utrRef: Optional[str] = None

class CreateGroupRequest(BaseModel):
    name: str
    initial_members: List[str] = []

class InviteGroupRequest(BaseModel):
    group_id: str
    target_username: str

class AudioVaultRequest(BaseModel):
    title: str
    audio_url: str
    doc_url: Optional[str] = ""
    category: Optional[str] = "Voice Story"
    desc: Optional[str] = ""

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
            "INSERT INTO messages (room_id, sender, text, media_type, media_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (
                room_id, 
                message.get("sender", "System"), 
                message.get("text", ""), 
                message.get("media_type", "text"),
                message.get("media_url", ""),
                message.get("timestamp", "")
            )
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
    return {"status": "online", "system": "Nexus Secure Marketplace, Group Comms & Audio Vault API"}

@app.get("/api/items")
async def get_items():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, price, currency, seller, seller_email, state, desc, category FROM items ORDER BY id DESC")
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
            "seller_email": r[5] if len(r) > 5 else "",
            "state": r[6],
            "desc": r[7],
            "category": r[8] if len(r) > 8 and r[8] else "Hardware"
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
        "INSERT INTO items (title, price, currency, seller, seller_email, state, desc, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (item.title, item.price, item.currency, user_payload["username"], user_payload.get("email", ""), item.state, item.desc, item.category or "Hardware")
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    res = item.dict()
    res["id"] = new_id
    res["seller"] = user_payload["username"]
    res["seller_email"] = user_payload.get("email", "")
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
    initial_balance = 0.0
    cursor.execute(
        "INSERT INTO users (username, email, hashed_password, role, cult_balance, is_pro, is_private, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (req.username, req.email, hashed_pw, req.role, initial_balance, 0, 0, "")
    )
    conn.commit()
    conn.close()
    
    token = create_access_token({"username": req.username, "role": req.role, "email": req.email})
    return {
        "status": "success",
        "username": req.username,
        "email": req.email,
        "role": req.role,
        "token": token,
        "cultBalance": initial_balance,
        "isPro": False,
        "isPrivate": False,
        "avatarUrl": ""
    }

@app.post("/api/auth/login")
async def login(req: AuthLoginRequest):
    now = time.time()
    user_attempts = [t for t in LOGIN_ATTEMPTS.get(req.username, []) if now - t < 60]
    if len(user_attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many failed login attempts. Please wait 60 seconds.")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT username, email, hashed_password, role, cult_balance, is_pro, is_private, avatar_url FROM users WHERE username = ?", (req.username,))
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
        "cultBalance": user_row[4] if len(user_row) > 4 and user_row[4] is not None else 0.0,
        "isPro": bool(user_row[5]) if len(user_row) > 5 and user_row[5] is not None else False,
        "isPrivate": bool(user_row[6]) if len(user_row) > 6 and user_row[6] is not None else False,
        "avatarUrl": user_row[7] if len(user_row) > 7 and user_row[7] is not None else ""
    }

@app.get("/api/user/profile/{username}")
async def get_user_profile(username: str, authorization: Optional[str] = Header(None)):
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            current_user = verify_jwt_token(token).get("username")
        except Exception:
            pass

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT username, email, role, is_pro, is_private, avatar_url FROM users WHERE username = ?", (username,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    
    is_owner = (current_user == username)
    is_private = bool(user_row[4])

    if is_private and not is_owner:
        conn.close()
        return {
            "username": user_row[0],
            "email": "HIDDEN (PRIVATE NODE)",
            "role": user_row[2],
            "isPro": bool(user_row[3]),
            "isPrivate": True,
            "avatarUrl": user_row[5] or "",
            "listedItems": [],
            "purchaseHistory": [],
            "message": "This node is marked PRIVATE by the owner."
        }

    # Fetch listed items
    cursor.execute("SELECT id, title, price, currency, state, desc, category FROM items WHERE seller = ?", (username,))
    listed_items = [{"id": r[0], "title": r[1], "price": r[2], "currency": r[3], "state": r[4], "desc": r[5], "category": r[6]} for r in cursor.fetchall()]
    
    # Fetch orders
    cursor.execute("SELECT id, total, timestamp, status FROM orders WHERE username = ?", (username,))
    orders = [{"id": r[0], "total": r[1], "timestamp": r[2], "status": r[3]} for r in cursor.fetchall()]
    
    conn.close()
    return {
        "username": user_row[0],
        "email": user_row[1] if is_owner else user_row[1],
        "role": user_row[2],
        "isPro": bool(user_row[3]),
        "isPrivate": is_private,
        "avatarUrl": user_row[5] or "",
        "listedItems": listed_items,
        "purchaseHistory": orders
    }

@app.post("/api/user/toggle-privacy")
async def toggle_privacy(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT is_private FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")

    new_status = 0 if row[0] else 1
    cursor.execute("UPDATE users SET is_private = ? WHERE username = ?", (new_status, username))
    conn.commit()
    conn.close()

    return {"status": "success", "username": username, "isPrivate": bool(new_status)}

@app.post("/api/user/update-avatar")
async def update_avatar(payload: dict, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]
    avatar_url = payload.get("avatarUrl", "").strip()

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET avatar_url = ? WHERE username = ?", (avatar_url, username))
    conn.commit()
    conn.close()

    return {"status": "success", "username": username, "avatarUrl": avatar_url}

@app.post("/api/user/upgrade-pro")
async def upgrade_to_pro(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT cult_balance, is_pro FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    
    balance, is_pro = row[0] or 0.0, bool(row[1])
    if is_pro:
        conn.close()
        raise HTTPException(status_code=400, detail="Account is already upgraded to PRO NODE.")
    
    PRO_COST = 25.0
    if balance < PRO_COST:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Upgrading to PRO costs {PRO_COST} CULT. Current balance: {balance} CULT.")
    
    new_balance = balance - PRO_COST
    cursor.execute("UPDATE users SET cult_balance = ?, is_pro = 1 WHERE username = ?", (new_balance, username))
    conn.commit()
    conn.close()
    
    return {"status": "success", "username": username, "cultBalance": new_balance, "isPro": True}

@app.post("/api/user/upgrade-pro-utr")
async def upgrade_to_pro_utr(req: ProUpgradeUtrRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    
    if user_payload["username"] != req.username:
        raise HTTPException(status_code=403, detail="Unauthorized account upgrade attempt.")

    clean_utr = req.utr_ref.strip()
    if not re.match(r"^\d{12}$", clean_utr):
        raise HTTPException(
            status_code=400, 
            detail="Invalid UTR Reference Number. Must be exactly a 12-digit numeric code from your UPI receipt."
        )

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT utr_ref, username FROM utr_transactions WHERE utr_ref = ?", (clean_utr,))
    existing_utr = cursor.fetchone()
    if existing_utr:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail=f"Security Violation: UTR {clean_utr} has already been redeemed and processed by @{existing_utr[1]}."
        )

    cursor.execute("SELECT is_pro FROM users WHERE username = ?", (req.username,))
    row = cursor.fetchone()
    if row and row[0]:
        conn.close()
        raise HTTPException(status_code=400, detail="Node is already upgraded to PRO Status.")

    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO utr_transactions (utr_ref, username, cult_amount, inr_amount, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
        (clean_utr, req.username, 25.0, 2500.0, timestamp_str, "PRO_UPGRADE_VERIFIED")
    )

    cursor.execute("UPDATE users SET is_pro = 1 WHERE username = ?", (req.username,))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "username": req.username,
        "isPro": True,
        "message": "UPI UTR verified! Your Node has been upgraded to PRO Status."
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

    clean_utr = req.utr_ref.strip()
    if not re.match(r"^\d{12}$", clean_utr):
        raise HTTPException(
            status_code=400, 
            detail="Invalid UTR Reference Number. Must be exactly a 12-digit numeric code from your UPI receipt."
        )

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT utr_ref, username FROM utr_transactions WHERE utr_ref = ?", (clean_utr,))
    existing_utr = cursor.fetchone()
    if existing_utr:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail=f"Security Violation: UTR {clean_utr} has already been redeemed and processed by @{existing_utr[1]}."
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

# Group Chat API Endpoints
@app.post("/api/groups/create")
async def create_group(req: CreateGroupRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    creator = user_payload["username"]

    group_id = f"group_{int(time.time())}_{creator}"
    members = list(set([creator] + req.initial_members))
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO groups (id, name, created_by, members_json, created_at) VALUES (?, ?, ?, ?, ?)",
        (group_id, req.name, creator, json.dumps(members), created_at)
    )
    conn.commit()
    conn.close()

    return {"status": "success", "groupId": group_id, "name": req.name, "members": members}

@app.get("/api/groups/my-groups")
async def get_my_groups(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    username = user_payload["username"]

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, created_by, members_json, created_at FROM groups")
    rows = cursor.fetchall()
    conn.close()

    my_groups = []
    for r in rows:
        members = json.loads(r[3])
        if username in members:
            my_groups.append({
                "id": r[0],
                "name": r[1],
                "createdBy": r[2],
                "members": members,
                "createdAt": r[4]
            })
    return my_groups

@app.post("/api/groups/invite")
async def invite_to_group(req: InviteGroupRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    inviter = user_payload["username"]

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, members_json FROM groups WHERE id = ?", (req.group_id,))
    group_row = cursor.fetchone()
    if not group_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Group not found.")

    members = json.loads(group_row[1])
    if req.target_username not in members:
        members.append(req.target_username)
        cursor.execute("UPDATE groups SET members_json = ? WHERE id = ?", (json.dumps(members), req.group_id))
        conn.commit()

    conn.close()
    return {"status": "success", "groupId": req.group_id, "invitedUser": req.target_username}

# Audio & Media Vault API
@app.get("/api/audio-vault")
async def get_audio_vault():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, author, audio_url, doc_url, category, desc, timestamp FROM audio_vault ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "title": r[1],
            "author": r[2],
            "audioUrl": r[3],
            "docUrl": r[4],
            "category": r[5],
            "desc": r[6],
            "timestamp": r[7]
        })
    return items

@app.post("/api/audio-vault")
async def publish_audio_vault(req: AudioVaultRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token required.")
    
    token = authorization.split(" ")[1]
    user_payload = verify_jwt_token(token)
    author = user_payload["username"]
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO audio_vault (title, author, audio_url, doc_url, category, desc, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (req.title, author, req.audio_url, req.doc_url or "", req.category or "Voice Story", req.desc or "", timestamp_str)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": new_id,
        "title": req.title,
        "author": author,
        "audioUrl": req.audio_url,
        "docUrl": req.doc_url or "",
        "category": req.category or "Voice Story",
        "desc": req.desc or "",
        "timestamp": timestamp_str
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
    cursor.execute(
        "SELECT id, username, items_json, total, shipping_json, payment_method, timestamp, status, receipt_json, utr_ref FROM orders WHERE username = ? ORDER BY rowid DESC",
        (username,)
    )
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
            "receipt": json.loads(r[8]) if r[8] else None,
            "utrRef": r[9] if len(r) > 9 else None
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
    
    if order.paymentMethod == 'qr_code':
        if not order.utrRef:
            conn.close()
            raise HTTPException(status_code=400, detail="UTR Reference Number is mandatory for UPI payments.")
        
        clean_utr = order.utrRef.strip()
        if not re.match(r"^\d{12}$", clean_utr):
            conn.close()
            raise HTTPException(status_code=400, detail="Invalid UTR Reference Number. Must be exactly 12 numeric digits.")
        
        cursor.execute("SELECT utr_ref, username FROM utr_transactions WHERE utr_ref = ?", (clean_utr,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"Security Violation: UTR {clean_utr} has already been used.")

        total_inr = float(order.total) * 100.0
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO utr_transactions (utr_ref, username, cult_amount, inr_amount, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
            (clean_utr, user_payload["username"], float(order.total), total_inr, timestamp_str, "ORDER_PAYMENT_VERIFIED")
        )

    if order.paymentMethod == 'cult_wallet':
        cursor.execute("SELECT cult_balance FROM users WHERE username = ?", (user_payload["username"],))
        row = cursor.fetchone()
        current_bal = row[0] if row and row[0] is not None else 0.0
        order_total = float(order.total)
        
        if current_bal < order_total:
            conn.close()
            raise HTTPException(status_code=400, detail=f"Insufficient CULT Balance. Available: {current_bal} CULT. Needed: {order_total} CULT.")
            
        new_balance = current_bal - order_total
        cursor.execute("UPDATE users SET cult_balance = ? WHERE username = ?", (new_balance, user_payload["username"]))

    cursor.execute(
        "INSERT INTO orders (id, username, items_json, total, shipping_json, payment_method, timestamp, status, receipt_json, utr_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            order.id,
            order.username,
            json.dumps(order.items),
            order.total,
            json.dumps(order.shipping),
            order.paymentMethod,
            order.timestamp,
            order.status,
            json.dumps(order.receipt) if order.receipt else None,
            order.utrRef or ""
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order.id}

# WebSocket Endpoints (Global, Private, Group)
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
        cursor.execute("SELECT id, sender, text, media_type, media_url, timestamp FROM messages WHERE room_id = 'global' ORDER BY id ASC LIMIT 50")
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "media_type": msg[3] or "text", "media_url": msg[4] or "", "timestamp": msg[5]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 8192:
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
        cursor.execute("SELECT id, sender, text, media_type, media_url, timestamp FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT 50", (room_id,))
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "media_type": msg[3] or "text", "media_url": msg[4] or "", "timestamp": msg[5]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 8192:
                continue
            try:
                msg_data = json.loads(raw_data)
                msg_data["sender"] = user_payload["username"]
                await manager.broadcast(msg_data, room_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

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

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT members_json FROM groups WHERE id = ?", (group_id,))
    group_row = cursor.fetchone()
    conn.close()

    if not group_row or user_payload["username"] not in json.loads(group_row[0]):
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, group_id)
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, sender, text, media_type, media_url, timestamp FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT 50", (group_id,))
        history = cursor.fetchall()
        conn.close()
        
        for msg in history:
            msg_obj = {"id": msg[0], "sender": msg[1], "text": msg[2], "media_type": msg[3] or "text", "media_url": msg[4] or "", "timestamp": msg[5]}
            await websocket.send_text(json.dumps(msg_obj))
            
        while True:
            raw_data = await websocket.receive_text()
            if len(raw_data) > 8192:
                continue
            try:
                msg_data = json.loads(raw_data)
                msg_data["sender"] = user_payload["username"]
                await manager.broadcast(msg_data, group_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)