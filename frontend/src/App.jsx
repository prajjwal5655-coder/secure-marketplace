import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  Shield, ShieldCheck, Lock, Mail, User, Eye, EyeOff, 
  ShoppingCart, Tag, PlusCircle, Globe, Wallet, CheckCircle, CheckCircle2,
  AlertTriangle, MessageSquare, Send, X, UserPlus, UserCheck, Terminal,
  MapPin, Phone, CreditCard, QrCode, ArrowRight, Trash2, ChevronLeft, Package,
  Wifi, WifiOff, Key, RefreshCw, Printer, Coins, Sparkles, Download, FileText,
  Banknote, ToggleLeft, ToggleRight, Bell, History, Check, Clock, ExternalLink,
  PhoneCall, MessageCircle, Video, VideoOff, Radio, Tv, Users, Layers,
  Flame, Maximize2, Minimize2, Volume2, VolumeX, Cast, Compass, Skull,
  PlayCircle, StopCircle, Mic, MicOff, Share2, Sliders, ScreenShare, UserX
} from 'lucide-react';

async function getDynamicRoomKey(roomId) {
  const enc = new TextEncoder();
  const roomSecret = `TON618_CHAT_ROOM_SALT_2026_${roomId}_SECURE_HMAC`;
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(roomSecret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`SALT_AEAD_256_${roomId}`),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(plainText, roomId) {
  try {
    const key = await getDynamicRoomKey(roomId);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(plainText)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    return plainText;
  }
}

async function decryptText(cipherBase64, roomId) {
  try {
    const binaryStr = atob(cipherBase64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await getDynamicRoomKey(roomId);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    return cipherBase64;
  }
}

// TON 618 // Interstellar Gargantua Black Hole - Exact Image with Live Moving Rings & Accretion Stream Simulation
function Ton618CosmicBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let startTime = Date.now();

    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 18,
        y: (e.clientY / window.innerHeight - 0.5) * 12
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Orbiting relativistic photon particles on the arches and disk
    const particleCount = 140;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const trackType = Math.random() < 0.42 ? 0 : Math.random() < 0.72 ? 1 : 2;
      const angle = Math.random() * Math.PI * 2;
      const radiusOffset = (Math.random() - 0.5) * 0.08;
      const speed = (0.007 + Math.random() * 0.014) * (trackType === 2 ? 1.5 : 1.0);
      const size = 1.0 + Math.random() * 2.2;
      const alpha = 0.4 + Math.random() * 0.6;
      const colorType = Math.random();
      const color = colorType > 0.65 ? '#ffffff' : colorType > 0.3 ? '#f59e0b' : '#38bdf8';

      particles.push({
        trackType,
        angle,
        radiusOffset,
        speed,
        size,
        alpha,
        color
      });
    }

    // 2. Relativistic plasma waves on Top Arch
    const topWaveCount = 6;
    const topWaves = Array.from({ length: topWaveCount }, (_, i) => ({
      phase: (i / topWaveCount) * Math.PI * 2,
      speed: 0.018 + i * 0.003,
      span: 0.35 + Math.random() * 0.45,
      widthScale: 0.92 + Math.random() * 0.16
    }));

    // 3. Relativistic plasma waves on Bottom Arch
    const botWaveCount = 5;
    const botWaves = Array.from({ length: botWaveCount }, (_, i) => ({
      phase: (i / botWaveCount) * Math.PI * 2,
      speed: 0.015 + i * 0.003,
      span: 0.3 + Math.random() * 0.4,
      widthScale: 0.88 + Math.random() * 0.22
    }));

    // 4. Horizontal Disk Flowing Relativistic Light Beams
    const diskBeamCount = 14;
    const diskBeams = Array.from({ length: diskBeamCount }, (_, i) => ({
      xProgress: Math.random(),
      speed: 0.009 + Math.random() * 0.018,
      yOffset: (Math.random() - 0.5) * 14,
      length: 70 + Math.random() * 180,
      thickness: 1.4 + Math.random() * 3.0,
      color: Math.random() > 0.4 ? '#ffffff' : '#fbbf24',
      opacity: 0.4 + Math.random() * 0.6
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Exact image cover coordinates mapping
      const imgAspect = 956 / 521;
      const screenAspect = width / height;
      let renderedW, renderedH, offsetX, offsetY;

      if (screenAspect > imgAspect) {
        renderedW = width;
        renderedH = width / imgAspect;
        offsetX = 0;
        offsetY = (height - renderedH) / 2;
      } else {
        renderedH = height;
        renderedW = height * imgAspect;
        offsetX = (width - renderedW) / 2;
        offsetY = 0;
      }

      const px = mouseRef.current.x;
      const py = mouseRef.current.y;

      // Exact black hole key landmarks from uploaded image
      const cx = offsetX + 0.465 * renderedW + px;
      const cy = offsetY + 0.505 * renderedH + py;
      const r_photon = 0.145 * renderedH;
      const r_top = 0.255 * renderedH;
      const r_bot = 0.250 * renderedH;
      const flareX = offsetX + 0.560 * renderedW + px;
      const flareY = offsetY + 0.506 * renderedH + py;
      const diskHalfWidth = 0.44 * renderedW;

      const time = (Date.now() - startTime) * 0.001;

      // --- A. ANIMATE EINSTEIN PHOTON RING ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, r_photon, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      ctx.setLineDash([48, 16, 28, 20]);
      ctx.lineDashOffset = -time * 70;
      ctx.stroke();
      ctx.restore();

      // --- B. ANIMATE TOP LENSED RING (Upper Arch Flowing Light) ---
      topWaves.forEach((w, idx) => {
        w.phase += w.speed;
        const startA = Math.PI + Math.sin(w.phase) * 0.85;
        const endA = startA + w.span;

        const grad = ctx.createLinearGradient(
          cx + Math.cos(startA) * r_top,
          cy + Math.sin(startA) * r_top * 0.72,
          cx + Math.cos(endA) * r_top,
          cy + Math.sin(endA) * r_top * 0.72
        );
        grad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        grad.addColorStop(0.5, idx % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(56, 189, 248, 0.8)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.0, 0.72);
        ctx.beginPath();
        ctx.arc(0, 0, r_top * w.widthScale, startA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.8 + Math.sin(time * 3 + idx) * 1.5;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 22;
        ctx.stroke();
        ctx.restore();
      });

      // --- C. ANIMATE BOTTOM LENSED RING (Lower Arch Flowing Light) ---
      botWaves.forEach((w, idx) => {
        w.phase += w.speed;
        const startA = 0.15 + (w.phase % Math.PI);
        const endA = startA + w.span;

        const grad = ctx.createLinearGradient(
          cx + Math.cos(startA) * r_bot,
          cy + Math.sin(startA) * r_bot * 0.68,
          cx + Math.cos(endA) * r_bot,
          cy + Math.sin(endA) * r_bot * 0.68
        );
        grad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.8)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.0, 0.68);
        ctx.beginPath();
        ctx.arc(0, 0, r_bot * w.widthScale, startA, endA);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.0 + Math.cos(time * 2.5 + idx) * 1.2;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      });

      // --- D. ANIMATE EQUATORIAL ACCRETION DISK (Horizontal Light Beams) ---
      diskBeams.forEach((bm) => {
        bm.xProgress += bm.speed;
        if (bm.xProgress > 1.0) {
          bm.xProgress = 0;
          bm.yOffset = (Math.random() - 0.5) * 14;
        }

        const currentX = cx - diskHalfWidth + bm.xProgress * (diskHalfWidth * 2);
        const currentY = cy + bm.yOffset;

        const distToFlare = Math.abs(currentX - flareX);
        const flareProximity = Math.max(0, 1.0 - distToFlare / (0.18 * renderedW));
        const effectiveAlpha = bm.opacity * (1.0 + flareProximity * 1.5);

        const beamGrad = ctx.createLinearGradient(currentX - bm.length, currentY, currentX, currentY);
        beamGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        beamGrad.addColorStop(0.7, bm.color);
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(currentX - bm.length, currentY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = bm.thickness * (1.0 + flareProximity * 0.9);
        ctx.globalAlpha = Math.min(1.0, effectiveAlpha);
        ctx.shadowColor = bm.color;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      });

      // --- E. ANIMATE ORBITING RELATIVISTIC PARTICLES ---
      particles.forEach((p) => {
        p.angle += p.speed;

        let pxCoord, pyCoord;
        if (p.trackType === 0) {
          const r = r_top * (1.0 + p.radiusOffset);
          pxCoord = cx + Math.cos(p.angle) * r;
          pyCoord = cy + Math.sin(p.angle) * r * 0.72;
        } else if (p.trackType === 1) {
          const r = r_bot * (1.0 + p.radiusOffset);
          pxCoord = cx + Math.cos(p.angle) * r;
          pyCoord = cy + Math.sin(p.angle) * r * 0.68;
        } else {
          const rX = diskHalfWidth * (0.3 + 0.7 * Math.abs(Math.cos(p.angle)));
          pxCoord = cx + Math.cos(p.angle) * rX;
          pyCoord = cy + Math.sin(p.angle) * 16 * (1.0 + p.radiusOffset);
        }

        const isApproaching = pxCoord < cx;
        const dopplerBoost = isApproaching ? 1.4 : 0.85;

        ctx.save();
        ctx.beginPath();
        ctx.arc(pxCoord, pyCoord, p.size * (isApproaching ? 1.25 : 0.9), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1.0, p.alpha * dopplerBoost);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      });

      // --- F. DOPPLER BEACON FLARE BREATHING & OPTICAL RAYS ---
      const flarePulse = 1.0 + 0.14 * Math.sin(time * 4.5);
      const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 70 * flarePulse);
      flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      flareGrad.addColorStop(0.2, 'rgba(251, 191, 36, 0.8)');
      flareGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.4)');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.translate(flareX, flareY);
      ctx.rotate(time * 0.25);
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 70 * flarePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(-120 * flarePulse, 0);
      ctx.lineTo(120 * flarePulse, 0);
      ctx.moveTo(0, -40 * flarePulse);
      ctx.lineTo(0, 40 * flarePulse);
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Exact Uploaded Interstellar Gargantua Black Hole Base Background */}
      <img
        src="/ton618_blackhole.jpg"
        alt="TON 618 Interstellar Black Hole"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        style={{
          filter: 'contrast(1.08) brightness(0.96)'
        }}
      />

      {/* Relativistic Accretion Ring Moving Light Animation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
        style={{
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
}

export default function App() {
  const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const defaultProdApi = 'https://nexus-secure-backend-68ki.onrender.com';
  const apiBaseUrl = (import.meta.env.VITE_API_URL || (isLocal ? `http://127.0.0.1:8000` : defaultProdApi)).replace(/\/+$/, '');
  
  const derivedWs = apiBaseUrl.startsWith('https://') 
    ? apiBaseUrl.replace(/^https:\/\//, 'wss://') 
    : apiBaseUrl.replace(/^http:\/\//, 'ws://');

  const wsBaseUrl = (import.meta.env.VITE_WS_URL || derivedWs).replace(/\/+$/, '');

  const [db, setDb] = useState({
    globalMessages: [],
    privateMessages: {},
    groupMessages: {},
    orders: []
  });

  const [decryptedCache, setDecryptedCache] = useState({});
  const [activeView, setActiveView] = useState('marketplace'); // 'marketplace' | 'group_dark' | 'global_chat' | 'private_chat' | 'cart' | 'checkout_address' | 'checkout_payment' | 'order_confirmed' | 'my_orders' | 'dashboard'
  const [authModal, setAuthModal] = useState(null); 
  const [userProfileModal, setUserProfileModal] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ton618_user') || localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [cultBalance, setCultBalance] = useState(0.0);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpTab, setTopUpTab] = useState('topup'); // 'topup' | 'history' | 'admin_queue'
  const [topUpAmount, setTopUpAmount] = useState(10);
  const [utrInput, setUtrInput] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [topUpReceipt, setTopUpReceipt] = useState(null);
  const [topUpHistory, setTopUpHistory] = useState([]);
  const [adminPendingUtrs, setAdminPendingUtrs] = useState([]);
  
  const [vendorOrders, setVendorOrders] = useState([]);
  const [vendorTab, setVendorTab] = useState('products'); // 'products' | 'orders'
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Group Dark & Live Streaming States (Persisted in localStorage so never lost on logout)
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('ton618_persisted_groups') || localStorage.getItem('nexus_persisted_groups');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedGroup, setSelectedGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('ton618_selected_group') || localStorage.getItem('nexus_selected_group');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [membersModalGroup, setMembersModalGroup] = useState(null);
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'live' | 'joined'
  const [mobileGroupTab, setMobileGroupTab] = useState('room'); // 'list' | 'room'
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', topic: '' });
  const [streamModal, setStreamModal] = useState(false);
  const [streamForm, setStreamForm] = useState({ title: 'Live Dark Web Broadcast', source: 'webcam' }); // 'webcam' | 'screen' | 'matrix'
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMuted, setStreamMuted] = useState(false);
  const [streamVolume, setStreamVolume] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [remoteStreamFrame, setRemoteStreamFrame] = useState(null);
  const [remoteStreamSource, setRemoteStreamSource] = useState(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [cart, setCart] = useState([]);
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('cult_wallet');
  const [lastOrder, setLastOrder] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '', confirmPassword: '', role: 'buyer' });
  const [authError, setAuthError] = useState('');
  const [chatInput, setChatInput] = useState('');

  const globalWsRef = useRef(null);
  const privateWsRef = useRef(null);
  const groupWsRef = useRef(null);
  const chatScrollRef = useRef(null);
  const videoStreamRef = useRef(null);
  const matrixCanvasRef = useRef(null);
  const mediaStreamTrackRef = useRef(null);
  const frameIntervalRef = useRef(null);

  // Marketplace items (Persisted in localStorage so never lost on logout)
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ton618_persisted_items') || localStorage.getItem('nexus_persisted_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newProduct, setNewProduct] = useState({ title: '', price: '', desc: '' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3800);
  };

  const fetchMarketItems = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/items`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          localStorage.setItem('ton618_persisted_items', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn("Backend API offline:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/groups`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGroups(data);
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(data));
          setSelectedGroup(prev => {
            if (!prev) {
              return data[0];
            }
            const updated = data.find(g => g.id === prev.id);
            return updated ? updated : prev;
          });
        }
      }
    } catch (err) {
      console.warn("Could not fetch dark groups:", err);
    }
  };

  const fetchWalletBalance = async (username, token) => {
    if (!username || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/wallet/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCultBalance(data.cultBalance);
      }
    } catch (err) {
      console.warn("Could not fetch wallet balance:", err);
    }
  };

  const fetchWalletTransactions = async (username, token) => {
    if (!username || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/wallet/${username}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopUpHistory(data);
      }
    } catch (err) {
      console.warn("Could not fetch transactions:", err);
    }
  };

  const fetchPendingUtrs = async () => {
    if (!user || !user.token || user.role !== 'admin') return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/utr/pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminPendingUtrs(data);
      }
    } catch (e) {
      console.warn("Could not fetch pending UTRs:", e);
    }
  };

  const handleReviewUtr = async (txId, action, notes = '') => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/utr/${txId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ action, notes })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(action === 'APPROVE' ? `✅ UTR Approved & +${data.credited} CULT credited to @${data.username}` : `❌ UTR Rejected for @${data.username}`);
        fetchPendingUtrs();
        fetchWalletBalance(user.username, user.token);
      } else {
        showToast(data.detail || "Review action failed.");
      }
    } catch (e) {
      showToast("Server request failed.");
    }
  };

  const fetchUserOrders = async (username, token) => {
    if (!username || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/orders/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDb(prev => ({ ...prev, orders: data }));
      }
    } catch (err) {
      console.warn("Could not fetch user orders:", err);
    }
  };

  const fetchVendorOrders = async (sellerUsername, token) => {
    if (!sellerUsername || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/vendor/orders/${sellerUsername}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendorOrders(data);
      }
    } catch (err) {
      console.warn("Could not fetch vendor orders:", err);
    }
  };

  const fetchNotifications = async (username, token) => {
    if (!username || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/notifications/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Could not fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchMarketItems();
    fetchGroups();
    const interval = setInterval(() => {
      fetchMarketItems();
      fetchGroups();
    }, 4000);
    return () => clearInterval(interval);
  }, [host, apiBaseUrl]);

  useEffect(() => {
    if (user && user.token) {
      localStorage.setItem('ton618_user', JSON.stringify(user));
      localStorage.setItem('nexus_user', JSON.stringify(user));
      fetchWalletBalance(user.username, user.token);
      fetchUserOrders(user.username, user.token);
      fetchNotifications(user.username, user.token);
      if (user.role === 'seller') {
        fetchVendorOrders(user.username, user.token);
      }
    } else {
      localStorage.removeItem('ton618_user');
      localStorage.removeItem('nexus_user');
      setCultBalance(0.0);
      setVendorOrders([]);
      setNotifications([]);
    }
  }, [user]);

  const processDecryption = async (msgList, roomId) => {
    for (const m of msgList) {
      if (m.text && !decryptedCache[`${roomId}_${m.text}`]) {
        const plain = await decryptText(m.text, roomId);
        setDecryptedCache(prev => ({ ...prev, [`${roomId}_${m.text}`]: plain }));
      }
    }
  };

  // Global Chat WebSocket
  useEffect(() => {
    if (!user || !user.token) return;

    const connectGlobalWS = () => {
      try {
        const ws = new WebSocket(`${wsBaseUrl}/ws/chat/global?token=${user.token}`);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            setDb(prev => {
              if (prev.globalMessages.some(m => m.id === data.id && m.timestamp === data.timestamp)) {
                return prev;
              }
              const updated = [...prev.globalMessages, data];
              processDecryption(updated, 'global');
              return { ...prev, globalMessages: updated };
            });
          } catch (e) {
            console.error("Failed to parse WebSocket packet:", e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectGlobalWS, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          ws.close();
        };

        globalWsRef.current = ws;
      } catch (err) {
        console.warn("Global WebSocket error:", err);
      }
    };

    connectGlobalWS();

    return () => {
      if (globalWsRef.current) globalWsRef.current.close();
    };
  }, [user, host, wsBaseUrl]);

  const getPrivateChatKey = (u1, u2) => [u1, u2].sort().join('_');

  // Private Chat WebSocket
  useEffect(() => {
    if (!user || !user.token || !activePrivateChat || activeView !== 'private_chat') return;

    const chatRoomId = getPrivateChatKey(user.username, activePrivateChat);
    const connectPrivateWS = () => {
      try {
        const ws = new WebSocket(`${wsBaseUrl}/ws/chat/private/${chatRoomId}?token=${user.token}`);

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            setDb(prev => {
              const existing = prev.privateMessages[chatRoomId] || [];
              if (existing.some(m => m.id === data.id && m.timestamp === data.timestamp)) {
                return prev;
              }
              const updated = [...existing, data];
              processDecryption(updated, chatRoomId);
              return {
                ...prev,
                privateMessages: {
                  ...prev.privateMessages,
                  [chatRoomId]: updated
                }
              };
            });
          } catch (e) {
            console.error("Failed to parse private WS message:", e);
          }
        };

        privateWsRef.current = ws;
      } catch (err) {
        console.warn("Private WS error:", err);
      }
    };

    connectPrivateWS();

    return () => {
      if (privateWsRef.current) privateWsRef.current.close();
    };
  }, [user, activePrivateChat, activeView, host, wsBaseUrl]);

  // Group Dark Chat & Streaming WebSocket
  useEffect(() => {
    if (!user || !user.token || !selectedGroup || activeView !== 'group_dark') return;

    const groupRoomId = `group_${selectedGroup.id}`;
    const connectGroupWS = () => {
      try {
        const ws = new WebSocket(`${wsBaseUrl}/ws/chat/group/${selectedGroup.id}?token=${user.token}`);

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Live Stream status change broadcast event
            if (data.type === 'STREAM_STATUS_CHANGE') {
              setSelectedGroup(prev => prev ? { ...prev, isLive: data.isLive, streamTitle: data.streamTitle } : prev);
              if (!data.isLive) {
                setRemoteStreamFrame(null);
              }
              fetchGroups();
              showToast(data.text);
            } else if (data.type === 'STREAM_FRAME') {
              // Remote stream frame from broadcaster
              setRemoteStreamFrame(data.frame);
              setRemoteStreamSource(data.source);
            } else if (data.type === 'VIEWER_COUNT_UPDATE') {
              // Real-time live viewer count (0 if 0, 22 if 22)
              setViewerCount(typeof data.count === 'number' ? data.count : 0);
            } else if (data.type === 'MEMBER_KICKED') {
              // Target operative removed by host
              if (user && data.kickedUser === user.username) {
                showToast("⚠️ You were removed from this syndicate by the host.");
              }
              setGroups(prev => {
                const updated = prev.map(g => g.id === selectedGroup?.id ? { ...g, members: data.members } : g);
                localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
                return updated;
              });
              setSelectedGroup(prev => prev ? { ...prev, members: data.members } : prev);
              setMembersModalGroup(prev => prev?.id === selectedGroup?.id ? { ...prev, members: data.members } : prev);
            }

            setDb(prev => {
              const existing = prev.groupMessages[selectedGroup.id] || [];
              if (existing.some(m => m.id === data.id && m.timestamp === data.timestamp)) {
                return prev;
              }
              const updated = [...existing, data];
              processDecryption(updated, groupRoomId);
              return {
                ...prev,
                groupMessages: {
                  ...prev.groupMessages,
                  [selectedGroup.id]: updated
                }
              };
            });
          } catch (e) {
            console.error("Failed to parse group WS message:", e);
          }
        };

        groupWsRef.current = ws;
      } catch (err) {
        console.warn("Group WS error:", err);
      }
    };

    connectGroupWS();

    return () => {
      if (groupWsRef.current) groupWsRef.current.close();
    };
  }, [user, selectedGroup?.id, activeView, host, wsBaseUrl]);

  // Fetch genuine real-time live viewer count for selected group
  useEffect(() => {
    if (!selectedGroup || activeView !== 'group_dark') return;

    const fetchGroupViewers = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/groups/${selectedGroup.id}/viewers`);
        if (res.ok) {
          const vdata = await res.json();
          setViewerCount(typeof vdata.viewers === 'number' ? vdata.viewers : 0);
        }
      } catch (e) {
        console.warn("Could not fetch group viewers:", e);
      }
    };

    fetchGroupViewers();
    const interval = setInterval(fetchGroupViewers, 3000);
    return () => clearInterval(interval);
  }, [selectedGroup?.id, activeView, apiBaseUrl]);

  // Attach MediaStream to local <video> element (Fixes Black Screen for Webcam & Screen Share)
  useEffect(() => {
    if (isStreaming && (streamForm.source === 'webcam' || streamForm.source === 'screen')) {
      if (videoStreamRef.current && mediaStreamTrackRef.current) {
        videoStreamRef.current.srcObject = mediaStreamTrackRef.current;
        videoStreamRef.current.play().catch(e => console.warn("Local video stream play notice:", e));
      }
    }
  }, [isStreaming, streamForm.source, selectedGroup?.id]);

  // Broadcaster frame capturing and WebSocket streaming to group members
  useEffect(() => {
    if (isStreaming && (streamForm.source === 'webcam' || streamForm.source === 'screen')) {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 640;
      offCanvas.height = 360;
      const ctx = offCanvas.getContext('2d');

      frameIntervalRef.current = setInterval(() => {
        try {
          if (
            videoStreamRef.current &&
            videoStreamRef.current.readyState >= 2 &&
            videoStreamRef.current.videoWidth > 0 &&
            groupWsRef.current &&
            groupWsRef.current.readyState === WebSocket.OPEN
          ) {
            ctx.drawImage(videoStreamRef.current, 0, 0, 640, 360);
            const frameData = offCanvas.toDataURL('image/jpeg', 0.55);
            groupWsRef.current.send(JSON.stringify({
              type: 'STREAM_FRAME',
              frame: frameData,
              source: streamForm.source
            }));
          }
        } catch (err) {
          // Silent frame catch
        }
      }, 120);

      return () => {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
          frameIntervalRef.current = null;
        }
      };
    } else {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    }
  }, [isStreaming, streamForm.source, selectedGroup?.id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [db.globalMessages, db.privateMessages, db.groupMessages, activeView, activePrivateChat, selectedGroup]);

  // Matrix / Cyber Rain Animation Generator for Canvas Stream Feed
  useEffect(() => {
    if (!matrixCanvasRef.current) return;
    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = 640;
    canvas.height = 360;

    const chars = '0123456789ABCDEF$#<>*~{}[]|/@=+-TON-618-BLACKHOLE-QUASAR-CULT';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(2, 3, 7, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f59e0b';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillStyle = i % 3 === 0 ? '#06b6d4' : i % 2 === 0 ? '#f59e0b' : '#10b981';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      // Add Cyber HUD overlay text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[TON 618 SYNDICATE LIVE FEED]`, 20, 25);
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`● LIVE STREAMING`, 20, 45);
      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`GRAVITATIONAL RELAY: ACTIVE | FPS: 60 | ENC: AES-256`, 20, 65);

      animationFrameId = requestAnimationFrame(drawMatrix);
    };

    drawMatrix();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isStreaming, selectedGroup?.isLive, activeView]);

  const addToCart = (item) => {
    if (item.state === 'Out of Stock') {
      showToast(`Item "${item.title}" is currently Out of Stock.`);
      return;
    }
    setCart(prevCart => {
      const existing = prevCart.find(i => i.id === item.id);
      if (existing) {
        return prevCart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prevCart, { ...item, qty: 1 }];
    });
    showToast(`Added "${item.title}" to Cart!`);
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const cartTotalCULT = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0).toFixed(2);
  const cartTotalINR = (parseFloat(cartTotalCULT) * 100).toLocaleString('en-IN');
  const totalNum = parseFloat(cartTotalCULT);
  const hasInsufficientBalance = paymentMethod === 'cult_wallet' && cultBalance < totalNum;

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.address || !shippingForm.city) {
      showToast("Please fill in all required shipping details.");
      return;
    }
    setActiveView('checkout_payment');
  };

  const processOrderPayment = async () => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    if (cart.length === 0) {
      showToast("Your cart is empty.");
      return;
    }

    if (paymentMethod === 'cult_wallet' && cultBalance < totalNum) {
      showToast(`Insufficient CULT Balance! You have ${cultBalance.toFixed(2)} CULT, but need ${totalNum.toFixed(2)} CULT.`);
      return;
    }

    const orderId = 'NEX-' + Math.floor(100000 + Math.random() * 900000);
    const receiptId = 'REC-' + Math.floor(10000000 + Math.random() * 90000000);
    
    let paymentLabel = 'CULT Virtual Wallet';
    let statusLabel = 'Escrow Locked / Processing';

    if (paymentMethod === 'offline_cash') {
      paymentLabel = 'Cash on Delivery / Direct to Vendor';
      statusLabel = 'Pending Cash on Delivery / Offline Collection';
    } else if (paymentMethod === 'qr_code') {
      paymentLabel = 'UPI / Google Pay (Prajjwal Maurya)';
      statusLabel = 'UPI Payment / Processing';
    } else if (paymentMethod === 'web3') {
      paymentLabel = 'Web3 Escrow Lock';
      statusLabel = 'Web3 Smart Contract Escrow';
    }

    const receiptObj = {
      receiptId: receiptId,
      orderId: orderId,
      date: new Date().toLocaleString(),
      customerName: shippingForm.fullName,
      customerPhone: shippingForm.phone,
      address: `${shippingForm.address}, ${shippingForm.city} - ${shippingForm.postalCode}`,
      paymentMethod: paymentLabel,
      items: cart.map(i => ({ title: i.title, seller: i.seller, qty: i.qty, priceCULT: i.price, subtotal: (parseFloat(i.price) * i.qty).toFixed(2) })),
      totalCULT: cartTotalCULT,
      totalINR: cartTotalINR,
      status: statusLabel
    };

    const newOrder = {
      id: orderId,
      username: user.username,
      items: [...cart],
      total: cartTotalCULT,
      shipping: { ...shippingForm },
      paymentMethod: paymentMethod,
      timestamp: new Date().toLocaleString(),
      status: statusLabel,
      receipt: receiptObj
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newOrder)
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.detail || "Order processing failed.");
        return;
      }

      if (paymentMethod === 'cult_wallet') {
        setCultBalance(prev => Math.max(0, prev - totalNum));
      }

      showToast(`🎉 Order ${orderId} placed successfully! Vendors notified.`);
    } catch (err) {
      console.warn("Could not save order to backend:", err);
      showToast("Order placed locally. Server sync pending.");
    }

    setDb(prev => ({ ...prev, orders: [newOrder, ...prev.orders] }));
    setLastOrder(newOrder);
    setLastReceipt(receiptObj);
    setCart([]);
    setActiveView('order_confirmed');
    fetchUserOrders(user.username, user.token);
    if (user.role === 'seller') {
      fetchVendorOrders(user.username, user.token);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    setTopUpError('');

    if (!user) return;
    const cleanUtr = utrInput.trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      setTopUpError("Invalid UTR Reference Number. Please enter the exact 12-digit numeric UPI Ref / UTR / RRN from your Google Pay receipt.");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          username: user.username,
          amount: parseFloat(topUpAmount),
          utr_ref: cleanUtr
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setTopUpError(data.detail || "UTR verification failed.");
        return;
      }

      if (data.status === 'pending_verification') {
        setTopUpReceipt(data.receipt);
        showToast(`⏳ UTR ${cleanUtr} submitted! Awaiting Admin Bank Verification.`);
      } else {
        setCultBalance(data.cultBalance);
        setTopUpReceipt(data.receipt);
        showToast(`UTR Verified! Credited +${topUpAmount} CULT Coins to your wallet.`);
      }
      setUtrInput('');
      fetchWalletTransactions(user.username, user.token);
      if (user.role === 'admin') {
        fetchPendingUtrs();
      }
    } catch (err) {
      setTopUpError("Backend verification request failed. Ensure server is online.");
    }
  };

  // Group Dark & Streaming Handlers
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupForm.name.trim() || !newGroupForm.topic.trim()) {
      showToast("Syndicate Name and Protocol Topic are required.");
      return;
    }

    if (!user) {
      setAuthModal('login');
      showToast("Please authenticate to establish a dark syndicate.");
      return;
    }

    const tempId = `grp-${Date.now() % 10000000}`;
    const timestampNow = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const localGroupObj = {
      id: tempId,
      name: newGroupForm.name.trim(),
      topic: newGroupForm.topic.trim(),
      creator: user.username,
      members: [user.username],
      isLive: false,
      streamTitle: '',
      createdAt: timestampNow
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: newGroupForm.name.trim(),
          topic: newGroupForm.topic.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        const createdGrp = data.group;
        setGroups(prev => {
          const updated = [createdGrp, ...prev.filter(g => g.id !== createdGrp.id)];
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
          return updated;
        });
        setSelectedGroup(createdGrp);
        setCreateGroupModal(false);
        setNewGroupForm({ name: '', topic: '' });
        showToast(`Syndicate "${createdGrp.name}" established!`);
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to create syndicate.");
      }
    } catch (err) {
      // Local persistent fallback so creation never fails
      setGroups(prev => {
        const updated = [localGroupObj, ...prev.filter(g => g.id !== localGroupObj.id)];
        localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
        return updated;
      });
      setSelectedGroup(localGroupObj);
      setCreateGroupModal(false);
      setNewGroupForm({ name: '', topic: '' });
      showToast(`Syndicate "${localGroupObj.name}" established!`);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!user) return;
    const grp = groups.find(g => g.id === groupId) || selectedGroup;
    const grpName = grp?.name || "this syndicate";
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete and disband syndicate "${grpName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setGroups(prev => {
          const updated = prev.filter(g => g.id !== groupId);
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
          return updated;
        });
        if (selectedGroup?.id === groupId) {
          const remaining = groups.filter(g => g.id !== groupId);
          setSelectedGroup(remaining.length > 0 ? remaining[0] : null);
        }
        showToast(`Syndicate "${grpName}" disbanded by admin.`);
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to delete syndicate.");
      }
    } catch (err) {
      setGroups(prev => {
        const updated = prev.filter(g => g.id !== groupId);
        localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
        return updated;
      });
      if (selectedGroup?.id === groupId) {
        const remaining = groups.filter(g => g.id !== groupId);
        setSelectedGroup(remaining.length > 0 ? remaining[0] : null);
      }
      showToast(`Syndicate "${grpName}" removed.`);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      setAuthModal('login');
      showToast("Please log in or register to join this syndicate.");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => {
          const updated = prev.map(g => g.id === groupId ? { ...g, members: data.members } : g);
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
          return updated;
        });
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(prev => ({ ...prev, members: data.members }));
        }
        showToast("Joined Dark Syndicate! Encrypted room unlocked.");
      } else {
        // Optimistic local join fallback
        setGroups(prev => {
          const updated = prev.map(g => {
            if (g.id === groupId) {
              const m = g.members || [];
              const newM = m.includes(user.username) ? m : [...m, user.username];
              return { ...g, members: newM };
            }
            return g;
          });
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
          return updated;
        });
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(prev => {
            if (!prev) return prev;
            const m = prev.members || [];
            const newM = m.includes(user.username) ? m : [...m, user.username];
            return { ...prev, members: newM };
          });
        }
        showToast("Joined Dark Syndicate!");
      }
    } catch (err) {
      // Offline fallback join
      setGroups(prev => {
        const updated = prev.map(g => {
          if (g.id === groupId) {
            const m = g.members || [];
            const newM = m.includes(user.username) ? m : [...m, user.username];
            return { ...g, members: newM };
          }
          return g;
        });
        localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
        return updated;
      });
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(prev => {
          if (!prev) return prev;
          const m = prev.members || [];
          const newM = m.includes(user.username) ? m : [...m, user.username];
          return { ...prev, members: newM };
        });
      }
      showToast("Joined Dark Syndicate!");
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!user) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => {
          const updated = prev.map(g => g.id === groupId ? { ...g, members: data.members } : g);
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
          return updated;
        });
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(prev => ({ ...prev, members: data.members }));
        }
        showToast("Left syndicate group.");
      }
    } catch (err) {
      setGroups(prev => {
        const updated = prev.map(g => {
          if (g.id === groupId) {
            return { ...g, members: (g.members || []).filter(m => m !== user.username) };
          }
          return g;
        });
        localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
        return updated;
      });
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(prev => ({ ...prev, members: (prev.members || []).filter(m => m !== user.username) }));
      }
      showToast("Left syndicate group.");
    }
  };

  const handleKickMember = async (groupId, targetUsername) => {
    if (!user) return;
    const targetGroup = groups.find(g => g.id === groupId) || selectedGroup;
    if (targetUsername === targetGroup?.creator) {
      showToast("Cannot kick the syndicate host.");
      return;
    }
    if (!window.confirm(`⚠️ Are you sure you want to remove operative @${targetUsername} from syndicate "${targetGroup?.name || 'this group'}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/${groupId}/kick/${targetUsername}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}` 
        }
      });

      if (res.ok) {
        const data = await res.json();
        setGroups(prev => {
          const updated = prev.map(g => g.id === groupId ? { ...g, members: data.members } : g);
          localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
          return updated;
        });
        setSelectedGroup(prev => prev?.id === groupId ? { ...prev, members: data.members } : prev);
        setMembersModalGroup(prev => prev?.id === groupId ? { ...prev, members: data.members } : prev);
        showToast(`⛔ Operative @${targetUsername} was removed from the syndicate.`);
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to remove operative.");
      }
    } catch (err) {
      // Offline fallback
      setGroups(prev => {
        const updated = prev.map(g => {
          if (g.id === groupId) {
            return { ...g, members: (g.members || []).filter(m => m !== targetUsername) };
          }
          return g;
        });
        localStorage.setItem('ton618_persisted_groups', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_groups', JSON.stringify(updated));
        return updated;
      });
      setSelectedGroup(prev => {
        if (prev?.id === groupId) {
          return { ...prev, members: (prev.members || []).filter(m => m !== targetUsername) };
        }
        return prev;
      });
      if (membersModalGroup?.id === groupId) {
        setMembersModalGroup(prev => prev ? { ...prev, members: (prev.members || []).filter(m => m !== targetUsername) } : prev);
      }
      showToast(`Operative @${targetUsername} removed.`);
    }
  };

  const startLiveStream = async () => {
    if (!user || !selectedGroup) return;

    let stream = null;
    try {
      if (streamForm.source === 'webcam') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
          });
        } catch (camAudioErr) {
          console.warn("Retrying video-only webcam:", camAudioErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false
            });
          } catch (camErr) {
            console.warn("Webcam access failed:", camErr);
            showToast("Webcam permission denied or camera not found. Using Cyber Matrix feed.");
            setStreamForm(prev => ({ ...prev, source: 'matrix' }));
          }
        }
      } else if (streamForm.source === 'screen') {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false
          });
        } catch (scrErr) {
          console.warn("Screen share failed:", scrErr);
          showToast("Screen share cancelled. Using Cyber Matrix feed.");
          setStreamForm(prev => ({ ...prev, source: 'matrix' }));
        }
      }

      if (stream) {
        mediaStreamTrackRef.current = stream;
        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) {
          vTrack.onended = () => {
            stopLiveStream();
          };
        }
      }

      const res = await fetch(`${apiBaseUrl}/api/groups/${selectedGroup.id}/stream`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ is_live: true, stream_title: streamForm.title })
      });

      if (res.ok) {
        setIsStreaming(true);
        setSelectedGroup(prev => ({ ...prev, isLive: true, streamTitle: streamForm.title }));
        setStreamModal(false);
        showToast(`🔴 YOU ARE LIVE: "${streamForm.title}"!`);
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to start live stream.");
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          mediaStreamTrackRef.current = null;
        }
      }
    } catch (err) {
      showToast("Failed to initiate live stream.");
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamTrackRef.current = null;
      }
    }
  };

  const stopLiveStream = async () => {
    if (!user || !selectedGroup) return;

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (mediaStreamTrackRef.current) {
      mediaStreamTrackRef.current.getTracks().forEach(track => track.stop());
      mediaStreamTrackRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.srcObject = null;
    }

    setRemoteStreamFrame(null);
    setIsStreaming(false);

    try {
      await fetch(`${apiBaseUrl}/api/groups/${selectedGroup.id}/stream`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ is_live: false, stream_title: '' })
      });
    } catch (e) {}

    setSelectedGroup(prev => ({ ...prev, isLive: false, streamTitle: '' }));
    showToast("⏹️ Live stream ended. Group chat remains active 24/7.");
  };

  const sendGroupMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !selectedGroup) return;

    const roomId = `group_${selectedGroup.id}`;
    const encryptedText = await encryptText(chatInput, roomId);
    const newMsg = {
      id: Date.now(),
      sender: user.username,
      text: encryptedText,
      timestamp: new Date().toISOString()
    };

    if (groupWsRef.current && groupWsRef.current.readyState === WebSocket.OPEN) {
      groupWsRef.current.send(JSON.stringify(newMsg));
    }

    setChatInput('');
  };

  const handleToggleStock = async (itemId) => {
    if (!user) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/items/${itemId}/toggle-stock`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(prev => {
          const updated = prev.map(item => item.id === itemId ? { ...item, state: data.state } : item);
          localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
          return updated;
        });
        showToast(`Product marked as ${data.state}!`);
      } else {
        const err = await res.json();
        showToast(err.detail || "Stock update failed.");
      }
    } catch (err) {
      setItems(prev => {
        const updated = prev.map(item => item.id === itemId ? { ...item, state: item.state === 'Available' ? 'Out of Stock' : 'Available' } : item);
        localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
        return updated;
      });
      showToast("Stock status updated.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to permanently delete this product from the marketplace?")) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setItems(prev => {
          const updated = prev.filter(item => item.id !== itemId);
          localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
          return updated;
        });
        showToast("Product deleted successfully from catalog!");
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to delete product.");
      }
    } catch (err) {
      setItems(prev => {
        const updated = prev.filter(item => item.id !== itemId);
        localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
        return updated;
      });
      showToast("Product deleted from catalog.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!user) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setVendorOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        showToast(`Order #${orderId} status updated to: ${newStatus}`);
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to update status.");
      }
    } catch (err) {
      showToast("Network error updating order status.");
    }
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
    setAuthError('');
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError("Passwords do not match!");
      return;
    }
    if (authForm.password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
          role: authForm.role
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setAuthError(errData.detail || "Registration failed.");
        return;
      }

      const data = await res.json();
      setUser({
        username: data.username,
        role: data.role,
        token: data.token,
        isVerified: true
      });
      setCultBalance(0.0);
      setAuthModal(null);
      showToast(`Node initialized: @${data.username} (0 CULT Balance)`);
    } catch (err) {
      setAuthError("Backend offline. Make sure Python server is running.");
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setAuthError(errData.detail || "Login failed.");
        return;
      }

      const userData = await res.json();
      setUser({
        username: userData.username,
        email: userData.email,
        role: userData.role,
        token: userData.token,
        isVerified: true
      });
      setCultBalance(userData.cultBalance || 0.0);

      setAuthModal(null);
      showToast(`Authenticated: @${userData.username}`);
    } catch (err) {
      setAuthError("Backend connection error.");
    }
  };

  const logout = () => {
    setUser(null);
    setCultBalance(0.0);
    localStorage.removeItem('ton618_user');
    localStorage.removeItem('nexus_user');
    setActiveView('marketplace');
  };

  const sendGlobalMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    
    const encryptedText = await encryptText(chatInput, 'global');
    const newMsg = {
      id: Date.now(),
      sender: user.username,
      text: encryptedText,
      timestamp: new Date().toISOString()
    };
    
    if (globalWsRef.current && globalWsRef.current.readyState === WebSocket.OPEN) {
      globalWsRef.current.send(JSON.stringify(newMsg));
    }

    setChatInput('');
  };

  const sendPrivateMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !activePrivateChat) return;

    const roomId = getPrivateChatKey(user.username, activePrivateChat);
    const encryptedText = await encryptText(chatInput, roomId);
    const newMsg = {
      id: Date.now(),
      sender: user.username,
      text: encryptedText,
      timestamp: new Date().toISOString()
    };

    if (privateWsRef.current && privateWsRef.current.readyState === WebSocket.OPEN) {
      privateWsRef.current.send(JSON.stringify(newMsg));
    }

    setChatInput('');
  };

  const handleDeployListing = async (e) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price || !user) return;

    const tempId = Date.now();
    const itemPayload = {
      id: tempId,
      title: newProduct.title,
      price: newProduct.price.toString(),
      currency: 'CULT',
      seller: user.username,
      state: 'Available',
      desc: newProduct.desc || 'No description provided.'
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(itemPayload)
      });
      if (res.ok) {
        const created = await res.json();
        setItems(prev => {
          const updated = [created, ...prev.filter(i => i.id !== created.id && i.id !== tempId)];
          localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
          return updated;
        });
        showToast("New item listed on hostel marketplace!");
      } else {
        setItems(prev => {
          const updated = [itemPayload, ...prev];
          localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
          return updated;
        });
        showToast("Item listed in catalog.");
      }
    } catch (err) {
      setItems(prev => {
        const updated = [itemPayload, ...prev];
        localStorage.setItem('ton618_persisted_items', JSON.stringify(updated));
        localStorage.setItem('nexus_persisted_items', JSON.stringify(updated));
        return updated;
      });
      showToast("Item listed in catalog.");
    }

    setNewProduct({ title: '', price: '', desc: '' });
  };

  const openPrivateChat = (targetUsername, contextText = '') => {
    setUserProfileModal(null);
    setActivePrivateChat(targetUsername);
    if (contextText) {
      setChatInput(contextText);
    }
    setActiveView('private_chat');
  };

  const renderAuthModal = () => {
    if (!authModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-cyan-500 to-slate-800"></div>

          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Lock className="text-cyan-400 w-5 h-5" />
              <h2 className="text-lg font-mono font-bold text-white tracking-widest uppercase">
                {authModal === 'login' ? 'Syndicate Login' : 'Operative Registration'}
              </h2>
            </div>
            <button onClick={() => setAuthModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          <form onSubmit={authModal === 'login' ? submitLogin : submitRegister} className="p-6 space-y-4 font-mono">
            {authError && (
              <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0"/> {authError}
              </div>
            )}

            {authModal === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Email Node</label>
                <input required type="email" name="email" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="agent@ton618.onion" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest">Operative Alias / Handle</label>
              <input required type="text" name="username" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="AnonymousHost" />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest">Passphrase</label>
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} name="password" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-600 hover:text-cyan-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authModal === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">Confirm Passphrase</label>
                  <input required type={showPassword ? "text" : "password"} name="confirmPassword" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="••••••••" />
                </div>

                <div className="pt-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Protocol Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center gap-1 ${authForm.role === 'buyer' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-black border-slate-800 hover:border-slate-600'}`}>
                      <input type="radio" name="role" value="buyer" checked={authForm.role === 'buyer'} onChange={handleAuthChange} className="hidden" />
                      <ShoppingCart className={`w-4 h-4 ${authForm.role === 'buyer' ? 'text-cyan-400' : 'text-slate-600'}`} />
                      <span className={`text-xs ${authForm.role === 'buyer' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>Buyer / Operative</span>
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center gap-1 ${authForm.role === 'seller' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-black border-slate-800 hover:border-slate-600'}`}>
                      <input type="radio" name="role" value="seller" checked={authForm.role === 'seller'} onChange={handleAuthChange} className="hidden" />
                      <Tag className={`w-4 h-4 ${authForm.role === 'seller' ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={`text-xs ${authForm.role === 'seller' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>Vendor / Seller</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-bold py-3 rounded-lg transition-all uppercase tracking-widest mt-4">
              {authModal === 'login' ? 'Decrypt & Authenticate' : 'Establish Onion Identity (0 CULT)'}
            </button>

            <div className="text-center pt-3 border-t border-slate-800 mt-4">
              {authModal === 'login' ? (
                <button type="button" onClick={() => setAuthModal('register')} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">Establish New Identity?</button>
              ) : (
                <button type="button" onClick={() => setAuthModal('login')} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">Existing Identity Login</button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderCreateGroupModal = () => {
    if (!createGroupModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
        <div className="bg-slate-950 border border-emerald-500/40 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative font-mono">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Skull className="text-emerald-400 w-5 h-5" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                Establish Dark Syndicate Group
              </h2>
            </div>
            <button onClick={() => setCreateGroupModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Syndicate Name *</label>
              <input 
                required
                type="text" 
                value={newGroupForm.name} 
                onChange={e => setNewGroupForm({...newGroupForm, name: e.target.value})} 
                placeholder="e.g. 0-Day Vulnerability Research" 
                className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none text-xs" 
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Syndicate Protocol Topic / Description *</label>
              <textarea 
                required
                rows="3"
                value={newGroupForm.topic} 
                onChange={e => setNewGroupForm({...newGroupForm, topic: e.target.value})} 
                placeholder="e.g. Secure comms, live video coding streams, hardware trade and hostel node discussion." 
                className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-xs resize-none" 
              />
            </div>

            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 text-[11px] text-emerald-300">
              ⚡ You will be the <strong>Host & Admin</strong> of this syndicate with permissions to broadcast <strong>Live Video Streams</strong> and moderate 24/7 encrypted group chat.
            </div>

            <button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-all shadow-lg">
              Establish Syndicate
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderStreamModal = () => {
    if (!streamModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
        <div className="bg-slate-950 border border-rose-500/50 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative font-mono">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Video className="text-rose-400 w-5 h-5 animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                Broadcast Live Video Feed
              </h2>
            </div>
            <button onClick={() => setStreamModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Live Stream Title *</label>
              <input 
                type="text" 
                value={streamForm.title} 
                onChange={e => setStreamForm({...streamForm, title: e.target.value})} 
                placeholder="e.g. Dark Web Live Coding & Security Audit" 
                className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-rose-500 focus:outline-none text-xs" 
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Video Feed Source</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={() => setStreamForm({...streamForm, source: 'matrix'})}
                  className={`p-2.5 rounded-lg border text-center transition-all ${streamForm.source === 'matrix' ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 font-bold' : 'bg-black border-slate-800 text-slate-400'}`}
                >
                  <Terminal className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[10px]">Cyber Feed</div>
                </button>
                <button 
                  type="button" 
                  onClick={() => setStreamForm({...streamForm, source: 'webcam'})}
                  className={`p-2.5 rounded-lg border text-center transition-all ${streamForm.source === 'webcam' ? 'bg-rose-950/50 border-rose-400 text-rose-300 font-bold' : 'bg-black border-slate-800 text-slate-400'}`}
                >
                  <Video className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[10px]">Webcam Feed</div>
                </button>
                <button 
                  type="button" 
                  onClick={() => setStreamForm({...streamForm, source: 'screen'})}
                  className={`p-2.5 rounded-lg border text-center transition-all ${streamForm.source === 'screen' ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300 font-bold' : 'bg-black border-slate-800 text-slate-400'}`}
                >
                  <ScreenShare className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[10px]">Screen Share</div>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
              <div>• Group members will receive an instant alert and see your video live.</div>
              <div>• Members will chat and comment in real-time right below the video player.</div>
            </div>

            <button 
              onClick={startLiveStream}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" /> Go Live to Syndicate
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTopUpModal = () => {
    if (!topUpModalOpen) return null;

    const inrValue = (topUpAmount * 100).toLocaleString('en-IN');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4" onClick={(e) => { if(e.target === e.currentTarget) { setTopUpModalOpen(false); setTopUpReceipt(null); } }}>
        <div className="bg-slate-950 border border-amber-500/40 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col font-mono">
          
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <Coins className="text-amber-400 w-5 h-5" />
              <h2 className="text-base font-bold text-white tracking-widest uppercase">
                Buy CULT Coins (UPI QR Verification)
              </h2>
            </div>
            <button onClick={() => { setTopUpModalOpen(false); setTopUpReceipt(null); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          <div className="flex border-b border-slate-800 bg-black text-xs shrink-0">
            <button 
              onClick={() => { setTopUpTab('topup'); setTopUpReceipt(null); }}
              className={`flex-1 py-2.5 text-center transition-colors flex items-center justify-center gap-1.5 ${topUpTab === 'topup' ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-amber-950/10' : 'text-slate-500 hover:text-white'}`}
            >
              <QrCode className="w-3.5 h-3.5" /> Scan QR & Verify UTR
            </button>
            <button 
              onClick={() => { setTopUpTab('history'); if(user) fetchWalletTransactions(user.username, user.token); }}
              className={`flex-1 py-2.5 text-center transition-colors flex items-center justify-center gap-1.5 ${topUpTab === 'history' ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-amber-950/10' : 'text-slate-500 hover:text-white'}`}
            >
              <History className="w-3.5 h-3.5" /> UTR History & Logs
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => { setTopUpTab('admin_queue'); fetchPendingUtrs(); }}
                className={`flex-1 py-2.5 text-center transition-colors flex items-center justify-center gap-1.5 ${topUpTab === 'admin_queue' ? 'text-rose-400 border-b-2 border-rose-400 font-bold bg-rose-950/10' : 'text-slate-500 hover:text-white'}`}
              >
                <Shield className="w-3.5 h-3.5" /> Admin Queue ({adminPendingUtrs.length})
              </button>
            )}
          </div>

          <div className="overflow-y-auto p-5 flex-1 space-y-4">
            {topUpTab === 'admin_queue' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Pending UTR Deposits ({adminPendingUtrs.length})</span>
                  <button onClick={fetchPendingUtrs} className="text-cyan-400 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3"/> Refresh
                  </button>
                </div>
                {adminPendingUtrs.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs">
                    No pending UTR deposits requiring review.
                  </div>
                ) : (
                  adminPendingUtrs.map(tx => (
                    <div key={tx.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-bold flex items-center gap-1.5">
                            <span>@{tx.username}</span>
                            <span className="text-amber-400">+{tx.cultAmount} CULT (₹{tx.inrAmount})</span>
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                            UTR Ref: <strong className="text-cyan-400">{tx.utrRef}</strong>
                          </div>
                          <div className="text-slate-600 text-[10px]">{tx.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-slate-800/80">
                        <button 
                          onClick={() => handleReviewUtr(tx.id, 'APPROVE')}
                          className="flex-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 py-1.5 rounded text-xs font-bold transition-colors"
                        >
                          ✅ Approve & Credit
                        </button>
                        <button 
                          onClick={() => {
                            const reason = window.prompt("Enter rejection reason (optional):", "Invalid reference number / unpaid");
                            if (reason !== null) handleReviewUtr(tx.id, 'REJECT', reason);
                          }}
                          className="flex-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 py-1.5 rounded text-xs font-bold transition-colors"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : topUpTab === 'history' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Recharge & UTR Log</span>
                  <span className="text-amber-400 font-bold">{cultBalance.toFixed(2)} CULT Available</span>
                </div>

                {topUpHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs">
                    No UTR recharges recorded.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topUpHistory.map((tx) => (
                      <div key={tx.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs flex justify-between items-center">
                        <div className="space-y-0.5">
                          <div className="text-white font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            UTR: <span className="text-cyan-400">{tx.utrRef}</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">{tx.timestamp}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-bold">+{tx.cultAmount} CULT</div>
                          <div className="text-slate-500 text-[10px]">₹{tx.inrAmount.toLocaleString('en-IN')} INR</div>
                          <div className="mt-1">
                            {tx.status === 'APPROVED_AND_CREDITED' || tx.status === 'VERIFIED_AND_CREDITED' ? (
                              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                ✅ Credited
                              </span>
                            ) : tx.status === 'PENDING_ADMIN_VERIFICATION' ? (
                              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                ⏳ Pending Review
                              </span>
                            ) : (
                              <span className="text-[9px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-bold">
                                ❌ Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : topUpReceipt ? (
              <div className="space-y-4">
                {topUpReceipt.status === 'Pending Admin Verification' ? (
                  <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4 text-center space-y-2">
                    <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                    <h3 className="text-white font-bold text-base uppercase">UTR Queued for Verification</h3>
                    <p className="text-amber-300 text-xs">Submitted reference #{topUpReceipt.utrRef}. Funds will be credited upon bank verification.</p>
                  </div>
                ) : (
                  <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-white font-bold text-base uppercase">Payment Verified & Credited</h3>
                    <p className="text-emerald-400 text-xs">+{topUpReceipt.cultCredited || topUpReceipt.cultAmount} CULT Coins added to @{topUpReceipt.username}</p>
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Receipt Serial:</span>
                    <span className="text-cyan-400 font-bold">{topUpReceipt.receiptId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>12-Digit UTR Number:</span>
                    <span className="text-amber-400 font-bold">{topUpReceipt.utrRef}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount:</span>
                    <span className="text-white font-bold">₹{topUpReceipt.inrPaid.toLocaleString('en-IN')} INR</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-amber-400 font-bold">{topUpReceipt.status}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Timestamp:</span>
                    <span className="text-slate-300">{topUpReceipt.date}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    <Printer className="w-3.5 h-3.5"/> Print Receipt
                  </button>
                  <button onClick={() => { setTopUpModalOpen(false); setTopUpReceipt(null); }} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTopUpSubmit} className="space-y-4">
                <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-300 flex items-center justify-between">
                  <span>Rate: 1 CULT = ₹100 INR</span>
                  <Sparkles className="w-4 h-4 text-amber-400"/>
                </div>

                {topUpError && (
                  <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0"/> {topUpError}
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Select CULT Coin Package</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[1, 5, 10, 25].map(amt => (
                      <button 
                        key={amt} 
                        type="button" 
                        onClick={() => setTopUpAmount(amt)} 
                        className={`py-2 rounded-lg text-xs border transition-all text-center ${topUpAmount === amt ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-md' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'}`}
                      >
                        <div>+{amt} CULT</div>
                        <div className="text-[9px] opacity-70">₹{amt * 100}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                    <span className="text-slate-500 text-xs">Custom CULT:</span>
                    <input 
                      type="number" 
                      min="1" 
                      value={topUpAmount} 
                      onChange={e => setTopUpAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-transparent text-white text-sm focus:outline-none"
                    />
                    <span className="text-amber-400 text-xs font-bold shrink-0">= ₹{inrValue} INR</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-center space-y-3">
                  <div className="text-xs text-slate-300 flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Scan with <strong className="text-white">Google Pay / PhonePe / Paytm</strong> to Pay <strong className="text-amber-400">₹{inrValue} INR</strong></span>
                  </div>

                  <div className="w-48 h-48 bg-white p-2 mx-auto rounded-xl border-2 border-cyan-500/70 shadow-2xl flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="/gpay_qr.png" 
                      alt="Google Pay UPI QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 bg-black/60 p-2.5 rounded-lg border border-slate-800">
                    <div>UPI Recipient: <strong className="text-white">Prajjwal Maurya</strong></div>
                    <code className="text-cyan-400 font-bold tracking-wider">prajjwal5655@okicici</code>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> 12-Digit UPI Ref / UTR Number *
                    </label>
                    <span className="text-[9px] text-slate-500">{utrInput.length}/12 Digits</span>
                  </div>
                  <input 
                    required
                    type="text" 
                    maxLength="12"
                    placeholder="e.g. 423891028374" 
                    value={utrInput} 
                    onChange={e => { setUtrInput(e.target.value.replace(/\D/g, '')); setTopUpError(''); }}
                    className="w-full bg-black border border-amber-500/60 rounded-lg px-4 py-2.5 text-amber-300 text-sm tracking-widest focus:border-amber-400 focus:outline-none shadow-inner"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    💡 Find the 12-digit numeric UPI Reference / UTR in your payment details after transferring ₹{inrValue}.
                  </span>
                </div>

                <button 
                  type="submit" 
                  disabled={utrInput.length !== 12}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-all shadow-lg"
                >
                  Verify UTR & Credit +{topUpAmount} CULT
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUserProfileModal = () => {
    if (!userProfileModal) return null;
    const isMe = user?.username === userProfileModal;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setUserProfileModal(null); }}>
        <div className="bg-black border border-slate-700 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl font-mono">
          <div className="p-6 text-center border-b border-slate-800 relative">
            <button onClick={() => setUserProfileModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-800 mb-4">
              <Terminal className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              @{userProfileModal}
            </h2>
          </div>
          
          <div className="p-4 bg-slate-900/50 space-y-3">
            {!isMe && user && (
              <button 
                onClick={() => openPrivateChat(userProfileModal)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-bold"
              >
                <MessageSquare className="w-4 h-4" /> Start Encrypted Comm
              </button>
            )}
            {!isMe && user && selectedGroup && (selectedGroup.creator === user.username || user.role === 'admin') && selectedGroup.members?.includes(userProfileModal) && userProfileModal !== selectedGroup.creator && (
              <button 
                onClick={() => {
                  handleKickMember(selectedGroup.id, userProfileModal);
                  setUserProfileModal(null);
                }}
                className="w-full bg-rose-950 hover:bg-rose-900 text-rose-300 py-2.5 rounded-lg border border-rose-800 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-bold"
              >
                <UserX className="w-4 h-4" /> Kick from #{selectedGroup.name}
              </button>
            )}
            {!user && (
              <p className="text-xs text-center text-slate-500 p-2">Authenticate to interact with this operative.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationsModal = () => {
    if (!showNotificationsModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowNotificationsModal(false); }}>
        <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh] font-mono">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="text-cyan-400 w-5 h-5" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                Activity & Order Alerts ({notifications.length})
              </h2>
            </div>
            <button onClick={() => setShowNotificationsModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                No alerts in log.
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold">{notif.title}</span>
                    <span className="text-[10px] text-slate-500">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{notif.message}</p>
                  <div className="pt-1 flex gap-2">
                    <button 
                      onClick={() => {
                        setShowNotificationsModal(false);
                        openPrivateChat(notif.sender, `Hello @${notif.sender}, regarding ${notif.title}: `);
                      }}
                      className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-3 py-1 rounded text-[10px] flex items-center gap-1 font-bold"
                    >
                      <MessageSquare className="w-3 h-3" /> Chat with @{notif.sender}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMembersModal = () => {
    if (!membersModalGroup) return null;
    const isCreator = user && (membersModalGroup.creator === user.username || user.role === 'admin');
    const memberList = membersModalGroup.members || [membersModalGroup.creator];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 font-mono" onClick={(e) => { if (e.target === e.currentTarget) setMembersModalGroup(null); }}>
        <div className="bg-black border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Operatives Roster ({memberList.length})
                </h2>
                <p className="text-[10px] text-slate-500 font-sans">{membersModalGroup.name}</p>
              </div>
            </div>
            <button onClick={() => setMembersModalGroup(null)} className="text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Host Admin Banner */}
          {isCreator && (
            <div className="bg-rose-950/30 border-b border-rose-900/40 p-2.5 text-[11px] text-rose-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Host Authority: You have permission to kick and remove operatives.</span>
            </div>
          )}

          {/* Member list */}
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs divide-y divide-slate-900">
            {memberList.map((memberUsername, idx) => {
              const isMemberHost = memberUsername === membersModalGroup.creator;
              const isMe = user?.username === memberUsername;

              return (
                <div key={idx} className="flex items-center justify-between pt-2.5 first:pt-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[11px] text-cyan-400">
                      {memberUsername.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          onClick={() => {
                            setMembersModalGroup(null);
                            setUserProfileModal(memberUsername);
                          }}
                          className="text-white font-bold text-xs cursor-pointer hover:text-cyan-400"
                        >
                          @{memberUsername}
                        </span>
                        {isMe && <span className="text-[9px] text-slate-500">(You)</span>}
                      </div>
                      <div>
                        {isMemberHost ? (
                          <span className="text-[9px] bg-amber-950/80 text-amber-400 border border-amber-800/80 px-1.5 py-0.2 rounded uppercase font-bold">
                            👑 Host / Creator
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-900 text-cyan-400 border border-slate-800 px-1.5 py-0.2 rounded uppercase">
                            Operative
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isMe && (
                      <button
                        onClick={() => {
                          setMembersModalGroup(null);
                          openPrivateChat(memberUsername);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-950 hover:bg-slate-900 rounded border border-slate-800 transition-colors"
                        title={`Encrypted comms with @${memberUsername}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isCreator && !isMemberHost && (
                      <button
                        onClick={() => handleKickMember(membersModalGroup.id, memberUsername)}
                        className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors shadow-sm"
                        title={`Kick operative @${memberUsername} from syndicate`}
                      >
                        <UserX className="w-3 h-3" /> Kick
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderChatInterface = (type) => {
    const isGlobal = type === 'global';
    const chatRoomId = isGlobal ? 'global' : getPrivateChatKey(user?.username, activePrivateChat);
    const messages = isGlobal 
      ? db.globalMessages 
      : (db.privateMessages[chatRoomId] || []);

    const chatTitle = isGlobal ? 'Global Dark Relay // ALL OPERATIVES' : `Private Channel: @${activePrivateChat}`;
    
    return (
      <div className="max-w-4xl mx-auto bg-black border border-slate-800 rounded-xl flex flex-col h-[75vh] shadow-2xl relative overflow-hidden font-mono">
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {isGlobal ? <Globe className="w-5 h-5 text-cyan-500" /> : <Lock className="w-5 h-5 text-emerald-500" />}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold tracking-wide">{chatTitle}</h3>
                {!isGlobal && (
                  <span className="text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">
                    Direct P2P
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                {wsConnected ? <span className="text-emerald-400 flex items-center gap-1"><Wifi className="w-3 h-3"/> Connected</span> : <span className="text-rose-400 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Connecting...</span>}
                | AES-256-GCM End-to-End Encrypted
              </p>
            </div>
          </div>
          {!isGlobal && (
            <button 
              onClick={() => setActiveView('marketplace')}
              className="text-xs text-slate-500 hover:text-white flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Market
            </button>
          )}
        </div>

        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 relative"
        >
          {messages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 text-xs uppercase tracking-widest gap-2">
              <MessageCircle className="w-8 h-8 opacity-40" />
              <span>No chat transmissions in room. Send a message to begin.</span>
            </div>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user?.username;
            const isSystem = msg.sender === 'SYSTEM_ORDER_BOT';
            const cacheKey = `${chatRoomId}_${msg.text}`;
            const plainText = isSystem ? msg.text : (decryptedCache[cacheKey] || msg.text);

            if (isSystem) {
              return (
                <div key={idx} className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 max-w-lg mx-auto text-xs shadow-md">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1 border-b border-slate-800 pb-1">
                    <Package className="w-4 h-4" /> System Order Alert
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed">{plainText}</pre>
                  <span className="text-[9px] text-slate-500 block text-right mt-1">{msg.timestamp}</span>
                </div>
              );
            }

            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="max-w-[75%]">
                  {!isMe && (
                    <span 
                      onClick={() => setUserProfileModal(msg.sender)}
                      className="text-[10px] text-cyan-500 mb-1 block cursor-pointer hover:text-cyan-300 ml-1 font-bold"
                    >
                      @{msg.sender}
                    </span>
                  )}
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-cyan-950 text-cyan-50 rounded-tr-sm border border-cyan-900' : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'}`}>
                    {plainText}
                  </div>
                  <span className={`text-[9px] text-slate-600 mt-1 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 z-10">
          <form onSubmit={isGlobal ? sendGlobalMessage : sendPrivateMessage} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isGlobal ? "Type global encrypted broadcast..." : `Message @${activePrivateChat}...`} 
              className="flex-1 bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm placeholder:text-slate-700"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="bg-cyan-950 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 border border-cyan-800 px-5 rounded-lg transition-colors flex items-center justify-center text-xs uppercase tracking-wider font-bold gap-1"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Group Dark Syndicates & Live Stream Layout
  const renderGroupDarkInterface = () => {
    const isMember = selectedGroup && selectedGroup.members?.includes(user?.username);
    const isCreator = selectedGroup && selectedGroup.creator === user?.username;
    const groupRoomId = selectedGroup ? `group_${selectedGroup.id}` : '';
    const groupMessages = selectedGroup ? (db.groupMessages[selectedGroup.id] || []) : [];

    const filteredGroups = groups.filter(g => {
      if (groupFilter === 'live') return g.isLive;
      if (groupFilter === 'joined') return user && g.members?.includes(user.username);
      return true;
    });

    return (
      <div className="space-y-4 font-mono">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Skull className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Dark Syndicates & Live Feeds</h2>
              {groups.some(g => g.isLive) && (
                <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Live Streams Online
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">
              Decentralized onion groups, live video broadcasting by hosts, and 24/7 persistent chat.
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => user ? setCreateGroupModal(true) : setAuthModal('login')}
              className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" /> + Create Syndicate
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tab (visible on smaller screens) */}
        <div className="flex lg:hidden border border-slate-800 rounded-lg bg-black p-1 text-xs">
          <button
            type="button"
            onClick={() => setMobileGroupTab('list')}
            className={`flex-1 py-2 text-center rounded transition-colors flex items-center justify-center gap-1.5 ${mobileGroupTab === 'list' ? 'bg-slate-800 text-white font-bold shadow' : 'text-slate-500'}`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Syndicate List ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileGroupTab('room')}
            className={`flex-1 py-2 text-center rounded transition-colors flex items-center justify-center gap-1.5 ${mobileGroupTab === 'room' ? 'bg-slate-800 text-white font-bold shadow' : 'text-slate-500'}`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" /> {selectedGroup ? selectedGroup.name : 'Active Room'}
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar: Groups List */}
          <div className={`lg:col-span-4 bg-black border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[78vh] ${mobileGroupTab === 'room' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-3 border-b border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" /> Syndicates ({groups.length})
                </span>
                <button onClick={fetchGroups} className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <button 
                  onClick={() => setGroupFilter('all')}
                  className={`py-1 rounded border transition-colors ${groupFilter === 'all' ? 'bg-slate-800 text-white border-slate-600 font-bold' : 'bg-slate-950 text-slate-500 border-slate-900'}`}
                >
                  All ({groups.length})
                </button>
                <button 
                  onClick={() => setGroupFilter('live')}
                  className={`py-1 rounded border transition-colors flex items-center justify-center gap-1 ${groupFilter === 'live' ? 'bg-rose-950/60 text-rose-400 border-rose-800 font-bold' : 'bg-slate-950 text-slate-500 border-slate-900'}`}
                >
                  <Radio className="w-2.5 h-2.5 text-rose-500" /> Live ({groups.filter(g => g.isLive).length})
                </button>
                <button 
                  onClick={() => setGroupFilter('joined')}
                  className={`py-1 rounded border transition-colors ${groupFilter === 'joined' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 font-bold' : 'bg-slate-950 text-slate-500 border-slate-900'}`}
                >
                  Joined
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-2 space-y-2 flex-1 divide-y divide-slate-900">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-xs">
                  No syndicates found in this category.
                </div>
              ) : (
                filteredGroups.map(grp => {
                  const isSelected = selectedGroup?.id === grp.id;
                  const isGrpMember = user && grp.members?.includes(user.username);
                  const isGrpCreator = user && grp.creator === user.username;

                  return (
                    <div 
                      key={grp.id}
                      onClick={() => { 
                        setSelectedGroup(grp); 
                        try { 
                          localStorage.setItem('ton618_selected_group', JSON.stringify(grp));
                          localStorage.setItem('nexus_selected_group', JSON.stringify(grp)); 
                        } catch (e) {}
                        setMobileGroupTab('room'); 
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all border pt-3 first:pt-3 ${isSelected ? 'bg-slate-900/90 border-cyan-500/80 shadow-lg' : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-white font-bold text-xs leading-snug line-clamp-1">{grp.name}</h4>
                        {grp.isLive ? (
                          <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse flex items-center gap-0.5 shrink-0 ml-1">
                            <Radio className="w-2.5 h-2.5" /> LIVE
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 bg-black px-1.5 py-0.5 rounded border border-slate-800 shrink-0 ml-1">
                            {grp.members?.length || 1} Ops
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">{grp.topic}</p>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <span>Host: <strong className="text-cyan-400">@{grp.creator}</strong></span>
                        
                        <div className="flex items-center gap-1.5">
                          {isGrpCreator && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteGroup(grp.id); }}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50 transition-colors"
                              title="Disband Syndicate (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isGrpMember ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> Joined
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleJoinGroup(grp.id); }}
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 px-2.5 py-0.5 rounded shadow-sm"
                            >
                              <UserPlus className="w-3 h-3" /> + Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Area: Video Player & 24/7 Group Chat */}
          <div className={`lg:col-span-8 bg-black border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[78vh] ${mobileGroupTab === 'list' ? 'hidden lg:flex' : 'flex'}`}>
            {selectedGroup ? (
              <>
                {/* Syndicate Header Banner */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-wide">{selectedGroup.name}</h3>
                      {selectedGroup.isLive && (
                        <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-bold animate-pulse flex items-center gap-1">
                          <Radio className="w-3 h-3" /> LIVE STREAMING
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{selectedGroup.topic}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Operatives Roster / Kick Management Modal Trigger */}
                    <button 
                      onClick={() => setMembersModalGroup(selectedGroup)}
                      className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm transition-colors"
                      title="View syndicate operatives roster and manage members"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Operatives ({selectedGroup.members?.length || 1})</span>
                    </button>

                    {/* Disband Syndicate button for creator / admin */}
                    {isCreator && (
                      <button 
                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                        className="bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"
                        title="Permanently Disband & Delete Syndicate"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Disband
                      </button>
                    )}

                    {/* Live Stream Controller for Host / Admin */}
                    {isCreator && (
                      selectedGroup.isLive ? (
                        <button 
                          onClick={stopLiveStream}
                          className="bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg"
                        >
                          <StopCircle className="w-4 h-4" /> End Stream
                        </button>
                      ) : (
                        <button 
                          onClick={() => setStreamModal(true)}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl animate-pulse"
                        >
                          <Video className="w-4 h-4" /> Start Stream
                        </button>
                      )
                    )}

                    {/* Join / Leave Group button */}
                    {isMember ? (
                      <button 
                        onClick={() => handleLeaveGroup(selectedGroup.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider"
                      >
                        Leave
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoinGroup(selectedGroup.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-400 px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold shadow-lg flex items-center gap-1.5 animate-pulse"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Join Syndicate
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Player Display Container */}
                <div className="relative bg-slate-950 border-b border-slate-800 h-64 shrink-0 overflow-hidden group flex items-center justify-center">
                  
                  {selectedGroup.isLive ? (
                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                      {/* If I am the active host/broadcaster streaming webcam or screen */}
                      {isStreaming && (streamForm.source === 'webcam' || streamForm.source === 'screen') ? (
                        <video 
                          ref={videoStreamRef} 
                          autoPlay 
                          playsInline 
                          muted={true}
                          onLoadedMetadata={() => {
                            if (videoStreamRef.current) {
                              videoStreamRef.current.play().catch(e => console.warn("Video play:", e));
                            }
                          }}
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : !isStreaming && remoteStreamFrame ? (
                        /* If I am a syndicate viewer and receiving live video frames from host */
                        <img 
                          src={remoteStreamFrame} 
                          alt="Live Broadcast Feed" 
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        /* Cyber Matrix stream feed */
                        <canvas ref={matrixCanvasRef} className="w-full h-full object-cover"></canvas>
                      )}

                      {/* Stream HUD Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                        <span className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded flex items-center gap-1 shadow-lg">
                          <Radio className="w-3 h-3" /> LIVE
                        </span>
                        <span className="bg-black/80 backdrop-blur-sm text-cyan-300 border border-cyan-500/40 text-[10px] px-2.5 py-1 rounded">
                          {selectedGroup.streamTitle || "Encrypted Syndicate Stream"}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
                        <span className="bg-black/80 backdrop-blur-sm text-slate-300 text-[10px] px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-400" /> {viewerCount} {viewerCount === 1 ? 'Viewer' : 'Viewers'}
                        </span>
                      </div>

                      {/* Stream Bottom Controls Bar */}
                      <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Broadcaster: <strong className="text-cyan-400">@{selectedGroup.creator}</strong>
                            {isStreaming && <span className="ml-1 text-emerald-400 font-bold">(You are broadcasting)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isStreaming && (
                            <button 
                              onClick={stopLiveStream}
                              className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <StopCircle className="w-3 h-3" /> End Broadcast
                            </button>
                          )}
                          <button 
                            onClick={() => setStreamMuted(!streamMuted)} 
                            className="p-1.5 text-slate-400 hover:text-white bg-black/60 rounded border border-slate-800"
                            title={streamMuted ? "Unmute" : "Mute"}
                          >
                            {streamMuted ? <VolumeX className="w-4 h-4 text-rose-400"/> : <Volume2 className="w-4 h-4 text-emerald-400"/>}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Offline Standby Cyber Screen */
                    <div className="text-center p-6 space-y-2 relative z-10">
                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800 mb-2">
                        <Tv className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider glow-text-ton">
                        [TON 618 SYNDICATE FEED // OFFLINE - HOST STANDBY]
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Syndicate chat is active 24/7 below. Host <strong className="text-cyan-400">@{selectedGroup.creator}</strong> will broadcast live video soon.
                      </p>
                      {isCreator ? (
                        <div className="pt-2">
                          <button 
                            onClick={() => setStreamModal(true)}
                            className="bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg"
                          >
                            <Video className="w-4 h-4" /> Start Broadcast Live
                          </button>
                        </div>
                      ) : !isMember && (
                        <div className="pt-2">
                          <button 
                            onClick={() => handleJoinGroup(selectedGroup.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg"
                          >
                            <UserPlus className="w-4 h-4" /> Join to Chat & Watch
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 24/7 Group Chat Messages Area */}
                <div 
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950 relative"
                >
                  <div className="text-center py-1">
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest bg-black px-3 py-1 rounded border border-slate-900">
                      🔒 24/7 End-to-End Encrypted Syndicate Channel
                    </span>
                  </div>

                  {groupMessages.length === 0 && (
                    <div className="text-center py-6 text-slate-700 text-xs">
                      No messages yet in this syndicate. Send the first transmission!
                    </div>
                  )}

                  {groupMessages.map((msg, idx) => {
                    const isMe = msg.sender === user?.username;
                    const isSystem = msg.sender === 'SYSTEM_SYNDICATE_BOT';
                    const cacheKey = `${groupRoomId}_${msg.text}`;
                    const plainText = isSystem ? msg.text : (decryptedCache[cacheKey] || msg.text);

                    if (isSystem) {
                      return (
                        <div key={idx} className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-2.5 max-w-md mx-auto text-xs text-center shadow-md">
                          <span className="text-emerald-400 font-bold">{plainText}</span>
                          <span className="text-[9px] text-slate-600 block mt-0.5">{msg.timestamp}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="max-w-[80%]">
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                              <span 
                                onClick={() => setUserProfileModal(msg.sender)}
                                className="text-[10px] text-cyan-400 cursor-pointer hover:underline font-bold"
                              >
                                @{msg.sender}
                              </span>
                              {msg.sender === selectedGroup.creator ? (
                                <span className="text-[8px] bg-amber-950 text-amber-400 border border-amber-900 px-1 py-0.2 rounded uppercase font-bold">Host</span>
                              ) : (
                                isCreator && msg.sender !== 'SYSTEM_SYNDICATE_BOT' && (
                                  <button
                                    type="button"
                                    onClick={() => handleKickMember(selectedGroup.id, msg.sender)}
                                    className="text-[8px] bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded uppercase font-bold flex items-center gap-0.5 ml-1 transition-colors"
                                    title={`Remove operative @${msg.sender} from syndicate`}
                                  >
                                    <UserX className="w-2.5 h-2.5" /> Kick
                                  </button>
                                )
                              )}
                            </div>
                          )}
                          <div className={`p-2.5 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-cyan-950 text-cyan-100 rounded-tr-sm border border-cyan-900' : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'}`}>
                            {plainText}
                          </div>
                          <span className={`text-[8px] text-slate-600 mt-0.5 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Group Chat Input / Join Call-To-Action */}
                <div className="p-3 bg-black border-t border-slate-800 shrink-0">
                  {!isMember ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                      <div className="text-xs text-emerald-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>You are viewing in spectator mode. Join this syndicate to participate in 24/7 comms.</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleJoinGroup(selectedGroup.id)}
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-lg animate-pulse"
                      >
                        <UserPlus className="w-4 h-4" /> Join Syndicate
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={sendGroupMessage} className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Message #${selectedGroup.name}...`} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-xs placeholder:text-slate-700"
                      />
                      <button 
                        type="submit" 
                        disabled={!chatInput.trim()}
                        className="bg-emerald-950 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 border border-emerald-800 px-4 rounded-lg transition-colors flex items-center justify-center text-xs uppercase tracking-wider font-bold gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600 text-xs">
                <Skull className="w-12 h-12 text-slate-800 mb-3" />
                <span>Select a Dark Syndicate from the left sidebar to join comms and watch live video streams.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen ton618-space-bg text-slate-200 font-sans relative">
      {/* TON 618 Live Animated Black Hole Photons & Accretion Lensing Layer */}
      <Ton618CosmicBackground />

      {renderAuthModal()}
      {renderCreateGroupModal()}
      {renderStreamModal()}
      {renderMembersModal()}
      {renderTopUpModal()}
      {renderUserProfileModal()}
      {renderNotificationsModal()}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500 text-cyan-200 px-4 py-3 rounded-lg font-mono text-sm shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TON 618 Event Horizon Circuit Header Strip */}
      <div className="bg-black/90 border-b border-amber-500/20 px-4 py-1 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            TON 618 EVENT HORIZON CIRCUIT
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-400">127.0.0.1 -&gt; RELAY-TON618 -&gt; TOR-TON618-CORE</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-cyan-400 font-mono">AES-256-GCM AEAD</span>
          <span className="text-amber-400 font-bold">1 CULT = ₹100 INR</span>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="border-b border-amber-500/20 bg-black/80 backdrop-blur-xl sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white font-mono font-bold text-xl tracking-widest cursor-pointer group" onClick={() => setActiveView('marketplace')}>
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-black border border-amber-500/80 shadow-lg group-hover:border-amber-400 accretion-pulse">
                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-cyan-400"></span>
                  <span className="absolute inset-0 rounded-full border border-amber-500/40 animate-ping"></span>
                </div>
                <span className="glow-text-ton font-extrabold text-amber-400 tracking-wider">
                  TON <span className="text-cyan-400">618</span>
                </span>
            </div>
            
            <div className="hidden md:flex gap-5 font-mono text-xs uppercase tracking-wider">
                <button onClick={() => setActiveView('marketplace')} className={`h-16 px-2 flex items-center transition-colors ${activeView === 'marketplace' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold glow-text-cyan' : 'text-slate-500 hover:text-white'}`}>Marketplace</button>
                
                {/* Group Dark / Syndicates Nav Tab */}
                <button 
                  onClick={() => setActiveView('group_dark')} 
                  className={`h-16 px-2 flex items-center gap-1.5 transition-colors ${activeView === 'group_dark' ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold glow-text-emerald' : 'text-slate-500 hover:text-white'}`}
                >
                  <Skull className="w-4 h-4 text-emerald-400"/> Group Dark {groups.some(g => g.isLive) && <span className="bg-rose-600 text-white text-[9px] px-1.5 rounded-full font-bold animate-pulse">LIVE</span>}
                </button>

                <button 
                  onClick={() => user ? setActiveView('global_chat') : setAuthModal('login')} 
                  className={`h-16 px-2 flex items-center gap-1.5 transition-colors ${activeView === 'global_chat' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-500 hover:text-white'}`}
                >
                  <Globe className="w-4 h-4"/> Global Chat
                </button>
                {user && (
                  <button onClick={() => setActiveView('my_orders')} className={`h-16 px-2 flex items-center gap-1.5 transition-colors ${activeView === 'my_orders' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-500 hover:text-white'}`}>
                    <Package className="w-4 h-4"/> Orders ({db.orders.length})
                  </button>
                )}
                {user?.role === 'seller' && (
                  <button onClick={() => { setActiveView('dashboard'); fetchVendorOrders(user.username, user.token); }} className={`h-16 px-2 flex items-center gap-1.5 transition-colors ${activeView === 'dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-slate-500 hover:text-white'}`}>
                    <Terminal className="w-4 h-4"/> Vendor Console {vendorOrders.length > 0 && <span className="bg-emerald-500 text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold">{vendorOrders.length}</span>}
                  </button>
                )}
            </div>

            <div className="flex items-center gap-3">
              {/* CULT Wallet Widget */}
              {user && (
                <div className="flex items-center bg-slate-900/90 border border-amber-500/50 rounded-lg px-3 py-1.5 font-mono text-xs gap-2 shadow-md">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-amber-400 font-bold">{cultBalance.toFixed(2)} CULT</span>
                    <span className="text-[9px] text-slate-500 block">≈ ₹{(cultBalance * 100).toLocaleString('en-IN')}</span>
                  </div>
                  <button 
                    onClick={() => { setTopUpModalOpen(true); setTopUpTab('topup'); }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-2.5 py-1 rounded transition-colors ml-1 shadow"
                  >
                    + Buy
                  </button>
                </div>
              )}

              {/* Notifications bell */}
              {user && (
                <button 
                  onClick={() => setShowNotificationsModal(true)} 
                  className="relative p-2 text-slate-400 hover:text-white transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-amber-500 text-black font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              )}

              {/* Cart button */}
              <button onClick={() => setActiveView('cart')} className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-black font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block cursor-pointer group" onClick={() => setUserProfileModal(user.username)}>
                    <div className="font-mono font-bold text-white flex items-center gap-1 justify-end group-hover:text-cyan-400 transition-colors">
                      @{user.username}
                    </div>
                    <div className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">{user.role}</div>
                  </div>
                  <button onClick={logout} className="text-[10px] uppercase tracking-widest font-mono text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900 px-2 py-1 rounded">Logout</button>
                </div>
              ) : (
                <div className="flex gap-2 font-mono">
                  <button onClick={() => setAuthModal('login')} className="px-3 py-1.5 text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</button>
                  <button onClick={() => setAuthModal('register')} className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest transition-all font-bold">Register</button>
                </div>
              )}
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* Marketplace View */}
        {activeView === 'marketplace' && (
            <div className="space-y-6 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-amber-400 tracking-tight uppercase glow-text-ton">TON 618 Dark Marketplace</h2>
                      <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">Encrypted P2P Commerce with Escrow, COD & Syndicate Relays.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveView('group_dark')}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Skull className="w-4 h-4" /> Dark Syndicates & Streams
                      </button>
                      {user && (
                        <button 
                          onClick={() => { setTopUpModalOpen(true); setTopUpTab('topup'); }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center gap-1 shadow"
                        >
                          <Coins className="w-3.5 h-3.5" /> Top Up Wallet
                        </button>
                      )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => {
                      const isOutOfStock = item.state === 'Out of Stock';

                      return (
                        <div key={item.id} className={`bg-black/90 border ${isOutOfStock ? 'border-rose-900/40 opacity-80' : 'border-slate-800 hover:border-slate-600'} rounded-xl p-5 shadow-lg flex flex-col transition-all group relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-1 h-full ${isOutOfStock ? 'bg-rose-600' : 'bg-slate-800 group-hover:bg-cyan-500'} transition-colors`}></div>
                            
                            <div className="flex justify-between items-start mb-3 pl-3">
                              <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                              {isOutOfStock && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded shrink-0">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-6 flex-1 pl-3 leading-relaxed">{item.desc}</p>
                            
                            <div className="flex items-center justify-between mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800 ml-3">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                                  Vendor<br/>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <button onClick={() => setUserProfileModal(item.seller)} className="text-cyan-500 hover:text-cyan-300 transition-colors font-bold">
                                      @{item.seller}
                                    </button>
                                    {user && user.username !== item.seller && (
                                      <button 
                                        onClick={() => openPrivateChat(item.seller, `Hi @${item.seller}, I have a question about "${item.title}".`)}
                                        className="text-slate-500 hover:text-cyan-400 p-1"
                                        title={`Chat with @${item.seller}`}
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Price</span><br/>
                                  <span className="text-lg font-bold text-amber-400">{item.price} <span className="text-xs text-amber-500">{item.currency || 'CULT'}</span></span>
                                  <span className="text-[10px] text-slate-500 block">≈ ₹{(parseFloat(item.price) * 100).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            
                            <div className="mt-auto pl-3 grid grid-cols-2 gap-2">
                                <button 
                                    disabled={isOutOfStock}
                                    onClick={() => addToCart(item)}
                                    className={`py-3 rounded-lg text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${isOutOfStock ? 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'}`}
                                >
                                    <ShoppingCart className="w-3.5 h-3.5"/> Cart
                                </button>
                                <button 
                                    disabled={isOutOfStock}
                                    onClick={() => {
                                      if (isOutOfStock) return;
                                      addToCart(item);
                                      if (!user) {
                                        setAuthModal('login');
                                      } else {
                                        setActiveView('cart');
                                      }
                                    }}
                                    className={`py-3 rounded-lg text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1 font-bold ${isOutOfStock ? 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed' : 'bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800'}`}
                                >
                                    {isOutOfStock ? 'Unavailable' : <><Lock className="w-3.5 h-3.5"/> Buy Now</>}
                                </button>
                            </div>
                        </div>
                      );
                    })}
                </div>
            </div>
        )}

        {/* Group Dark Syndicates View */}
        {activeView === 'group_dark' && renderGroupDarkInterface()}

        {/* Cart View */}
        {activeView === 'cart' && (
          <div className="max-w-3xl mx-auto space-y-6 font-mono">
            <button onClick={() => setActiveView('marketplace')} className="text-slate-500 hover:text-white text-xs flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Marketplace
            </button>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="text-cyan-400" /> Shopping Cart
            </h2>

            {cart.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center space-y-4">
                <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-slate-500 text-sm">Your cart is currently empty.</p>
                <button onClick={() => setActiveView('marketplace')} className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-6 py-2 rounded-lg text-xs uppercase tracking-widest">Browse Marketplace</button>
              </div>
            ) : (
              <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="space-y-4 divide-y divide-slate-800">
                  {cart.map(item => (
                    <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-500">Vendor: @{item.seller} | {item.price} CULT (≈ ₹{parseFloat(item.price) * 100})</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-950 text-xs">
                          <button onClick={() => updateCartQty(item.id, -1)} className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800">-</button>
                          <span className="px-3 py-1 text-white">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800">+</button>
                        </div>
                        <span className="text-sm font-bold text-amber-400 w-24 text-right">
                          {(parseFloat(item.price) * item.qty).toFixed(2)} CULT
                        </span>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-rose-400"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-6 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-widest block">Cart Total Value</span>
                    <span className="text-2xl font-bold text-amber-400">{cartTotalCULT} CULT</span>
                    <span className="text-xs text-slate-400 block">≈ ₹{cartTotalINR} INR</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (!user) {
                        setAuthModal('login');
                      } else {
                        setActiveView('checkout_address');
                      }
                    }}
                    className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center gap-2"
                  >
                    Proceed to Shipping <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipping Address View */}
        {activeView === 'checkout_address' && (
          <div className="max-w-2xl mx-auto space-y-6 font-mono">
            <button onClick={() => setActiveView('cart')} className="text-slate-500 hover:text-white text-xs flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Cart
            </button>
            
            <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
                <MapPin className="text-cyan-400" /> Shipping & Contact Details
              </h3>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Full Name *</label>
                    <input required type="text" value={shippingForm.fullName} onChange={e => setShippingForm({...shippingForm, fullName: e.target.value})} placeholder="Resident / Buyer Name" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Phone Number *</label>
                    <input required type="tel" value={shippingForm.phone} onChange={e => setShippingForm({...shippingForm, phone: e.target.value})} placeholder="+91 9876543210" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Hostel Room & Block / Address *</label>
                  <input required type="text" value={shippingForm.address} onChange={e => setShippingForm({...shippingForm, address: e.target.value})} placeholder="Room 204, Boys Hostel Block 2, Campus" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">City / Campus *</label>
                    <input required type="text" value={shippingForm.city} onChange={e => setShippingForm({...shippingForm, city: e.target.value})} placeholder="Greater Noida" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Postal Pin Code</label>
                    <input type="text" value={shippingForm.postalCode} onChange={e => setShippingForm({...shippingForm, postalCode: e.target.value})} placeholder="201310" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 py-3 rounded-lg text-xs uppercase tracking-widest font-bold mt-4">
                  Continue to Payment Options
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Payment View */}
        {activeView === 'checkout_payment' && (
          <div className="max-w-2xl mx-auto space-y-6 font-mono">
            <button onClick={() => setActiveView('checkout_address')} className="text-slate-500 hover:text-white text-xs flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Shipping Address
            </button>

            <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
                <CreditCard className="text-cyan-400" /> Select Payment Rail
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                  onClick={() => setPaymentMethod('cult_wallet')}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 text-center ${paymentMethod === 'cult_wallet' ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <Coins className={`w-5 h-5 ${paymentMethod === 'cult_wallet' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div className="text-xs font-bold text-white">CULT Wallet</div>
                  <div className="text-[9px] text-amber-400">{cultBalance.toFixed(1)} CULT avail.</div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('offline_cash')}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 text-center ${paymentMethod === 'offline_cash' ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <Banknote className={`w-5 h-5 ${paymentMethod === 'offline_cash' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className="text-xs font-bold text-white">Direct Cash</div>
                  <div className="text-[9px] text-emerald-400">Offline / In-Hand</div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('qr_code')}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 text-center ${paymentMethod === 'qr_code' ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <QrCode className={`w-5 h-5 ${paymentMethod === 'qr_code' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="text-xs font-bold text-white">GPay QR</div>
                  <div className="text-[9px] text-slate-500">Prajjwal Maurya</div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('web3')}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 text-center ${paymentMethod === 'web3' ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <Wallet className={`w-5 h-5 ${paymentMethod === 'web3' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <div className="text-xs font-bold text-white">Web3 Lock</div>
                  <div className="text-[9px] text-slate-500">MetaMask ETH</div>
                </div>
              </div>

              {paymentMethod === 'cult_wallet' && (
                <div className="space-y-3">
                  {hasInsufficientBalance ? (
                    <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5" /> Insufficient CULT Balance!
                      </div>
                      <p className="text-xs text-slate-300">
                        You have <strong className="text-amber-400">{cultBalance.toFixed(2)} CULT</strong>, but this order total is <strong className="text-white">{cartTotalCULT} CULT</strong>.
                        <br/>
                        <span className="text-rose-400 text-[11px]">Short by {(totalNum - cultBalance).toFixed(2)} CULT (≈ ₹{((totalNum - cultBalance) * 100).toLocaleString('en-IN')})</span>
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                        <button 
                          onClick={() => { setTopUpModalOpen(true); setTopUpTab('topup'); }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-4 h-4" /> Top Up Wallet via GPay QR
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('offline_cash')}
                          className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Banknote className="w-4 h-4" /> Pay Offline Cash to Vendor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-5 text-center space-y-2">
                      <Coins className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300">Deducting <strong className="text-amber-400 font-bold">{cartTotalCULT} CULT</strong> from your CULT Virtual Wallet.</p>
                      <p className="text-[10px] text-slate-500">Remaining Balance after order: <strong className="text-white">{(cultBalance - totalNum).toFixed(2)} CULT</strong></p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'offline_cash' && (
                <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-5 text-center space-y-3">
                  <Banknote className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="text-white font-bold text-sm">Direct Offline Hand-to-Hand Payment</h4>
                    <p className="text-emerald-300 text-xs mt-1">
                      Pay <strong className="text-white font-bold">₹{cartTotalINR} INR</strong> ({cartTotalCULT} CULT value) in cash directly to the vendor upon room delivery or campus pickup.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'qr_code' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center space-y-3">
                  <span className="text-xs text-slate-400 uppercase tracking-widest block">Direct Google Pay UPI QR</span>
                  <div className="w-40 h-40 bg-white p-2 mx-auto rounded-xl shadow-xl border-2 border-cyan-500/50">
                    <img 
                      src="/gpay_qr.png" 
                      alt="Prajjwal Maurya UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Recipient: <strong className="text-white">Prajjwal Maurya</strong> (<code className="text-cyan-400">prajjwal5655@okicici</code>)<br/>
                    Total: <strong className="text-emerald-400 font-bold">₹{cartTotalINR} INR</strong> ({cartTotalCULT} CULT)
                  </div>
                </div>
              )}

              {paymentMethod === 'web3' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                  <Wallet className="w-10 h-10 text-purple-400 mx-auto" />
                  <p className="text-xs text-slate-400">Smart Contract: <code className="text-purple-400">0x71C...39A</code></p>
                  <p className="text-[11px] text-slate-500">Decentralized Web3 escrow locking {cartTotalCULT} CULT equivalent in simulated ETH smart contract.</p>
                </div>
              )}

              <button 
                disabled={hasInsufficientBalance}
                onClick={processOrderPayment}
                className="w-full bg-emerald-950 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 border border-emerald-800 py-3.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4"/> Confirm Order & Submit ({paymentMethod === 'offline_cash' ? 'Cash on Delivery' : `${cartTotalCULT} CULT`})
              </button>
            </div>
          </div>
        )}

        {/* Order Confirmed Receipt View */}
        {activeView === 'order_confirmed' && lastOrder && lastReceipt && (
          <div className="max-w-2xl mx-auto space-y-6 font-mono">
            <div className="bg-black border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"></div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-xl tracking-widest">
                    <Shield className="w-6 h-6 text-amber-400" />
                    <span className="glow-text-ton text-amber-400">TON 618 <span className="text-cyan-400">RECEIPT</span></span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">TON 618 Network Verified Transaction</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider block">
                    {lastReceipt.status}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">{lastReceipt.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-widest">Receipt Serial</span>
                  <span className="text-cyan-400 font-bold">{lastReceipt.receiptId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-widest">Order ID</span>
                  <span className="text-white font-bold">{lastReceipt.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-widest">Deliver To</span>
                  <span className="text-white">{lastReceipt.customerName} ({lastReceipt.customerPhone})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-widest">Payment Rail</span>
                  <span className="text-amber-400 font-bold">{lastReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Purchased Items & Vendors</span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
                  {lastReceipt.items.map((item, i) => (
                    <div key={i} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="text-white font-bold">{item.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">Vendor: @{item.seller} | Qty: {item.qty}</span>
                          <button 
                            onClick={() => openPrivateChat(item.seller, `Hi @${item.seller}, regarding my Order #${lastReceipt.orderId} for "${item.title}": `)}
                            className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-0.5 font-bold"
                          >
                            <MessageSquare className="w-3 h-3" /> Chat Vendor
                          </button>
                        </div>
                      </div>
                      <span className="text-amber-400 font-bold">{item.subtotal} CULT</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-widest block">Total</span>
                  <span className="text-2xl font-bold text-amber-400">{lastReceipt.totalCULT} CULT</span>
                  <span className="text-xs text-slate-400 block">≈ ₹{lastReceipt.totalINR} INR</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4"/> Print / PDF
                  </button>
                  <button 
                    onClick={() => setActiveView('my_orders')}
                    className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold"
                  >
                    View Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Orders History View */}
        {activeView === 'my_orders' && (
          <div className="max-w-4xl mx-auto space-y-6 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="text-cyan-400" /> My Purchases & Order History
              </h2>
              <button 
                onClick={() => fetchUserOrders(user?.username, user?.token)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {db.orders.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm space-y-3">
                <Package className="w-10 h-10 text-slate-700 mx-auto" />
                <p>No active or past orders found.</p>
                <button onClick={() => setActiveView('marketplace')} className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold">
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {db.orders.map(order => {
                  const uniqueVendors = [...new Set(order.items.map(i => i.seller).filter(Boolean))];

                  return (
                    <div key={order.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold text-sm">Order #{order.id}</span>
                            <span className="text-[10px] text-slate-500">• {order.timestamp}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Payment: <strong className="text-amber-400">{order.paymentMethod === 'offline_cash' ? '💵 Cash on Delivery' : order.paymentMethod === 'cult_wallet' ? '🪙 CULT Wallet' : order.paymentMethod}</strong>
                          </span>
                        </div>
                        <span className="text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-900 shrink-0 font-bold">
                          {order.status}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800 bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-2">
                        {order.items.map((itm, idx) => (
                          <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-white font-bold">{itm.title}</span>
                              <div className="text-[10px] text-slate-500">Qty: {itm.qty} • Vendor: @{itm.seller}</div>
                            </div>
                            <span className="text-amber-400 font-bold">{(parseFloat(itm.price) * itm.qty).toFixed(2)} CULT</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center pt-2 gap-3 text-xs">
                        <div className="text-slate-400">
                          Total: <strong className="text-amber-400 text-sm">{order.total} CULT</strong> (≈ ₹{(parseFloat(order.total) * 100).toLocaleString('en-IN')})
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {uniqueVendors.map(vendor => (
                            <button 
                              key={vendor}
                              onClick={() => openPrivateChat(vendor, `Hi @${vendor}, I am checking on my Order #${order.id}.`)}
                              className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 font-bold"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Chat with @{vendor}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === 'global_chat' && renderChatInterface('global')}
        {activeView === 'private_chat' && renderChatInterface('private')}

        {/* Seller Vendor Console */}
        {activeView === 'dashboard' && user?.role === 'seller' && (
          <div className="space-y-6 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3 glow-text-emerald">
                    <Terminal className="w-6 h-6 text-emerald-500" /> Vendor Console
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                    Manage your product inventory, stock status, and incoming customer orders.
                  </p>
                </div>

                <div className="flex gap-2 text-xs">
                  <button 
                    onClick={() => setVendorTab('products')}
                    className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${vendorTab === 'products' ? 'bg-emerald-950 text-emerald-400 border-emerald-700 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    <Package className="w-4 h-4" /> Products ({items.filter(i => i.seller === user.username).length})
                  </button>
                  <button 
                    onClick={() => { setVendorTab('orders'); fetchVendorOrders(user.username, user.token); }}
                    className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${vendorTab === 'orders' ? 'bg-emerald-950 text-emerald-400 border-emerald-700 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    <ShoppingCart className="w-4 h-4" /> Incoming Sales ({vendorOrders.length})
                  </button>
                </div>
            </div>

            {vendorTab === 'orders' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Customer Orders for your Products</span>
                  <button onClick={() => fetchVendorOrders(user.username, user.token)} className="text-cyan-400 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
                  </button>
                </div>

                {vendorOrders.length === 0 ? (
                  <div className="bg-black border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
                    No customer orders received yet. When someone orders your item, it will appear here instantly!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendorOrders.map(order => (
                      <div key={order.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-bold text-sm">Order #{order.id}</span>
                              <span className="text-[10px] text-slate-500">• {order.timestamp}</span>
                            </div>
                            <div className="text-xs text-slate-300 mt-1">
                              Buyer: <strong className="text-cyan-400 cursor-pointer" onClick={() => setUserProfileModal(order.customerUsername)}>@{order.customerUsername}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-3 py-1 rounded border border-amber-900">
                              {order.paymentMethod === 'offline_cash' ? '💵 Cash on Delivery' : '🪙 CULT Wallet Paid'}
                            </span>
                            <span className="text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-900 font-bold">
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-2 text-xs">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Items Ordered from You:</span>
                          {order.vendorItems.map((itm, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-white font-bold">{itm.title} (x{itm.qty})</span>
                              <span className="text-amber-400 font-bold">{(parseFloat(itm.price) * itm.qty).toFixed(2)} CULT (₹{(parseFloat(itm.price) * itm.qty * 100).toLocaleString('en-IN')})</span>
                            </div>
                          ))}
                        </div>

                        {/* Customer Delivery Details */}
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Delivery & Contact Information:</span>
                          <div className="text-slate-300"><strong>Name:</strong> {order.shipping?.fullName || 'N/A'}</div>
                          <div className="text-slate-300 flex items-center gap-2">
                            <strong>Phone:</strong> 
                            <a href={`tel:${order.shipping?.phone}`} className="text-cyan-400 hover:underline flex items-center gap-1 font-bold">
                              <Phone className="w-3 h-3" /> {order.shipping?.phone || 'N/A'}
                            </a>
                          </div>
                          <div className="text-slate-300"><strong>Address:</strong> {order.shipping?.address}, {order.shipping?.city} {order.shipping?.postalCode ? `- ${order.shipping?.postalCode}` : ''}</div>
                        </div>

                        {/* Action Buttons: Status Updater & Chat with Buyer */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Update Status:</span>
                            <select 
                              value={order.status} 
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-xs focus:outline-none"
                            >
                              <option value="Pending / Processing">Pending / Processing</option>
                              <option value="Accepted & Preparing">Accepted & Preparing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered & Paid">Delivered & Paid (Completed)</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                          <button 
                            onClick={() => openPrivateChat(order.customerUsername, `Hello @${order.customerUsername}, I am contacting you regarding your Order #${order.id}: `)}
                            className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" /> Chat with Buyer (@{order.customerUsername})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deploy Listing Form */}
                <div className="lg:col-span-1">
                  <div className="bg-black border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 to-emerald-500"></div>
                    <h3 className="text-sm font-bold text-emerald-500 mb-6 uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Deploy New Listing</h3>
                    
                    <form onSubmit={handleDeployListing} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Product Title *</label>
                        <input required type="text" value={newProduct.title} onChange={e=>setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm" placeholder="e.g. WiFi Range Extender" />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Price (CULT Coins) *</label>
                        <input required type="number" step="1" min="1" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm" placeholder="e.g. 20" />
                        <span className="text-[9px] text-slate-500 block mt-1">≈ ₹{(parseFloat(newProduct.price || 0) * 100).toLocaleString('en-IN')} INR</span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Description *</label>
                        <textarea required value={newProduct.desc} onChange={e=>setNewProduct({...newProduct, desc: e.target.value})} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm resize-none" placeholder="Provide product details, condition, room delivery notes..."></textarea>
                      </div>

                      <button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-bold py-3 rounded-lg text-xs tracking-widest uppercase shadow-md">Publish Product</button>
                    </form>
                  </div>
                </div>

                {/* Product Inventory Management */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span>Your Listed Products</span>
                      <span>Total: {items.filter(item => item.seller === user.username).length} Items</span>
                    </div>

                    {items.filter(item => item.seller === user.username).length === 0 ? (
                      <div className="bg-black border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs">
                        You haven't listed any products yet. Use the form on the left to deploy your first listing!
                      </div>
                    ) : (
                      items.filter(item => item.seller === user.username).map(item => {
                        const isOutOfStock = item.state === 'Out of Stock';

                        return (
                          <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-700 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-base">{item.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${isOutOfStock ? 'bg-rose-950/50 text-rose-400 border-rose-800' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800'}`}>
                                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                </span>
                              </div>
                              <p className="text-xs text-amber-400">{item.price} CULT (≈ ₹{parseFloat(item.price) * 100})</p>
                              <p className="text-xs text-slate-400 max-w-md line-clamp-2">{item.desc}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => handleToggleStock(item.id)}
                                className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all font-bold border ${isOutOfStock ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-800' : 'bg-amber-950 hover:bg-amber-900 text-amber-400 border-amber-800'}`}
                                title={isOutOfStock ? "Click to mark Available / In Stock" : "Click to mark Out of Stock"}
                              >
                                {isOutOfStock ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                {isOutOfStock ? 'Set In Stock' : 'Set Out of Stock'}
                              </button>

                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800 px-3 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 font-bold transition-all"
                                title="Delete product permanently"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}