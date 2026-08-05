import os
import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import Dict, List, Optional

app = FastAPI(title="Secure Market API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ItemModel(BaseModel):
    id: int
    title: str
    price: str
    currency: str = "ETH"
    seller: str
    state: str = "Available"
    desc: str

class MessageModel(BaseModel):
    id: int
    sender: str
    text: str
    timestamp: str

class AuthRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = "user@secure.net"

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.global_history: List[dict] = []
        self.items_store: List[dict] = [
            { "id": 1, "title": "Zero-Log Encrypted Router", "price": "0.5", "currency": "ETH", "seller": "SecureTech", "state": "Available", "desc": "Military-grade hardware firewall router with zero tracking." },
            { "id": 2, "title": "Anonymous VPN Server Config", "price": "0.1", "currency": "ETH", "seller": "NetNinja", "state": "Available", "desc": "Self-hosted VPN configuration scripts with automated kill-switch." },
            { "id": 3, "title": "Hardware Crypto Cold Wallet", "price": "0.25", "currency": "ETH", "seller": "CryptoVault", "state": "Available", "desc": "Tamper-proof hardware wallet for offline private key storage." }
        ]

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
        if room_id == "global":
            self.global_history.append(message)
            if len(self.global_history) > 100:
                self.global_history.pop(0)

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
    return {"status": "online", "system": "Nexus Market Relay"}

@app.get("/api/items")
async def get_items():
    return manager.items_store

@app.post("/api/items")
async def create_item(item: ItemModel):
    item_dict = item.dict()
    manager.items_store.insert(0, item_dict)
    return item_dict

@app.post("/api/auth/register")
async def register(req: AuthRequest):
    return {"status": "success", "username": req.username, "msg": "Node initialized."}

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    return {"status": "success", "username": req.username, "token": "mock_jwt_token"}

@app.websocket("/ws/chat/global")
async def global_chat_ws(websocket: WebSocket):
    await manager.connect(websocket, "global")
    try:
        for past_msg in manager.global_history:
            await websocket.send_text(json.dumps(past_msg))
            
        while True:
            raw_data = await websocket.receive_text()
            try:
                msg_data = json.loads(raw_data)
                await manager.broadcast(msg_data, "global")
            except json.JSONDecodeError:
                msg_obj = {
                    "id": int(os.urandom(4).hex(), 16),
                    "sender": "Anonymous",
                    "text": raw_data,
                    "timestamp": ""
                }
                await manager.broadcast(msg_obj, "global")
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")

@app.websocket("/ws/chat/private/{room_id}")
async def private_chat_ws(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_obj = json.loads(data)
                await manager.broadcast(msg_obj, room_id)
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)