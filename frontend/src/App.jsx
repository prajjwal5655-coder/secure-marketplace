import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, ShieldCheck, Lock, Mail, User, Eye, EyeOff, 
  ShoppingCart, Tag, PlusCircle, Globe, Wallet, CheckCircle, CheckCircle2,
  AlertTriangle, MessageSquare, Send, X, UserPlus, UserCheck, Terminal,
  MapPin, Phone, CreditCard, QrCode, ArrowRight, Trash2, ChevronLeft, Package,
  Wifi, WifiOff, Key, RefreshCw, Printer, Coins, Sparkles, Download, FileText
} from 'lucide-react';

async function getDynamicRoomKey(roomId) {
  const enc = new TextEncoder();
  const roomSecret = `NEXUS_CHAT_ROOM_SALT_2026_${roomId}`;
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
      salt: enc.encode(`SALT_${roomId}`),
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
    console.error("AES-256-GCM Encryption Error:", err);
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

export default function App() {
  const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const isProduction = host.includes('vercel.app') || host.includes('onrender.com') || host.includes('netlify.app');

  const defaultProdApi = 'https://nexus-secure-backend.onrender.com';
  const defaultProdWs = 'wss://nexus-secure-backend.onrender.com';

  const apiBaseUrl = (import.meta.env.VITE_API_URL || (isProduction ? defaultProdApi : `http://${host}:8000`)).replace(/\/+$/, '');
  const wsBaseUrl = (import.meta.env.VITE_WS_URL || (isProduction ? defaultProdWs : `ws://${host}:8000`)).replace(/\/+$/, '');

  const [db, setDb] = useState({
    globalMessages: [],
    privateMessages: {},
    orders: []
  });

  const [decryptedCache, setDecryptedCache] = useState({});
  const [activeView, setActiveView] = useState('marketplace'); 
  const [authModal, setAuthModal] = useState(null); 
  const [userProfileModal, setUserProfileModal] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [cultBalance, setCultBalance] = useState(0.0);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(10);
  const [utrInput, setUtrInput] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [topUpReceipt, setTopUpReceipt] = useState(null);
  
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
  const chatScrollRef = useRef(null);

  const [items, setItems] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', desc: '' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchMarketItems = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/items`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      }
    } catch (err) {
      console.warn("Backend API offline:", err);
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

  useEffect(() => {
    fetchMarketItems();
    const interval = setInterval(fetchMarketItems, 4000);
    return () => clearInterval(interval);
  }, [host, apiBaseUrl]);

  useEffect(() => {
    if (user && user.token) {
      localStorage.setItem('nexus_user', JSON.stringify(user));
      fetchWalletBalance(user.username, user.token);
      fetchUserOrders(user.username, user.token);
    } else {
      localStorage.removeItem('nexus_user');
      setCultBalance(0.0);
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

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [db.globalMessages, db.privateMessages, activeView, activePrivateChat]);

  const addToCart = (item) => {
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

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.address || !shippingForm.city) {
      showToast("Please fill in all required shipping details.");
      return;
    }
    setActiveView('checkout_payment');
  };

  const processOrderPayment = async () => {
    const totalNum = parseFloat(cartTotalCULT);

    if (paymentMethod === 'cult_wallet' && cultBalance < totalNum) {
      showToast(`Insufficient CULT Balance! You need ${totalNum} CULT. Please top up your wallet.`);
      return;
    }

    const orderId = 'NEX-' + Math.floor(100000 + Math.random() * 900000);
    const receiptId = 'REC-' + Math.floor(10000000 + Math.random() * 90000000);
    
    const receiptObj = {
      receiptId: receiptId,
      orderId: orderId,
      date: new Date().toLocaleString(),
      customerName: shippingForm.fullName,
      customerPhone: shippingForm.phone,
      address: `${shippingForm.address}, ${shippingForm.city} - ${shippingForm.postalCode}`,
      paymentMethod: paymentMethod === 'cult_wallet' ? 'CULT Virtual Wallet' : paymentMethod === 'qr_code' ? 'UPI / Google Pay (Prajjwal Maurya)' : 'Web3 Escrow',
      items: cart.map(i => ({ title: i.title, seller: i.seller, qty: i.qty, priceCULT: i.price, subtotal: (parseFloat(i.price) * i.qty).toFixed(2) })),
      totalCULT: cartTotalCULT,
      totalINR: cartTotalINR,
      status: 'Escrow Locked & Verified'
    };

    const newOrder = {
      id: orderId,
      username: user.username,
      items: [...cart],
      total: cartTotalCULT,
      shipping: { ...shippingForm },
      paymentMethod: paymentMethod,
      timestamp: new Date().toLocaleString(),
      status: 'Escrow Locked / Processing',
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
        setCultBalance(prev => prev - totalNum);
      }
    } catch (err) {
      console.warn("Could not save order to backend:", err);
    }

    setDb(prev => ({ ...prev, orders: [newOrder, ...prev.orders] }));
    setLastOrder(newOrder);
    setLastReceipt(receiptObj);
    setCart([]);
    setActiveView('order_confirmed');
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    setTopUpError('');

    if (!user) return;
    if (!utrInput || utrInput.trim().length !== 12 || !/^\d{12}$/.test(utrInput.strip ? utrInput.strip() : utrInput.trim())) {
      setTopUpError("Invalid UTR Reference Number. Please enter the exact 12-digit numeric UPI Ref / UTR / RRN from your UPI app receipt.");
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
          utr_ref: utrInput.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setTopUpError(data.detail || "UTR verification failed.");
        return;
      }

      setCultBalance(data.cultBalance);
      setTopUpReceipt(data.receipt);
      showToast(`UTR Verified! Credited +${topUpAmount} CULT Coins to your wallet.`);
      setUtrInput('');
    } catch (err) {
      setTopUpError("Backend verification request failed. Ensure server is online.");
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

    const itemPayload = {
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
        await fetchMarketItems();
      }
    } catch (err) {
      console.warn("Could not post item to backend:", err);
    }

    setNewProduct({ title: '', price: '', desc: '' });
    showToast("New item listed on hostel marketplace!");
  };

  const openPrivateChat = (targetUsername) => {
    setUserProfileModal(null);
    setActivePrivateChat(targetUsername);
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
                {authModal === 'login' ? 'System Login' : 'Node Registration'}
              </h2>
            </div>
            <button onClick={() => setAuthModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          <form onSubmit={authModal === 'login' ? submitLogin : submitRegister} className="p-6 space-y-4">
            
            {authError && (
              <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-3 rounded-lg text-sm flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0"/> {authError}
              </div>
            )}

            {authModal === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Email Node</label>
                <input required type="email" name="email" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm" placeholder="user@secure.net" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Alias / ID</label>
              <input required type="text" name="username" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm" placeholder="AnonymousUser" />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Passphrase</label>
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} name="password" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg pl-4 pr-10 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-600 hover:text-cyan-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authModal === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Confirm Passphrase</label>
                  <input required type={showPassword ? "text" : "password"} name="confirmPassword" onChange={handleAuthChange} className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm" placeholder="••••••••" />
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Protocol Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center gap-1 ${authForm.role === 'buyer' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-black border-slate-800 hover:border-slate-600'}`}>
                      <input type="radio" name="role" value="buyer" checked={authForm.role === 'buyer'} onChange={handleAuthChange} className="hidden" />
                      <ShoppingCart className={`w-4 h-4 ${authForm.role === 'buyer' ? 'text-cyan-400' : 'text-slate-600'}`} />
                      <span className={`font-mono text-xs ${authForm.role === 'buyer' ? 'text-cyan-400' : 'text-slate-500'}`}>Acquirer</span>
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center gap-1 ${authForm.role === 'seller' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-black border-slate-800 hover:border-slate-600'}`}>
                      <input type="radio" name="role" value="seller" checked={authForm.role === 'seller'} onChange={handleAuthChange} className="hidden" />
                      <Tag className={`w-4 h-4 ${authForm.role === 'seller' ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={`font-mono text-xs ${authForm.role === 'seller' ? 'text-emerald-400' : 'text-slate-500'}`}>Vendor</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-mono font-bold py-3 rounded-lg transition-all uppercase tracking-widest mt-4">
              {authModal === 'login' ? 'Authenticate' : 'Initialize Node (0 CULT)'}
            </button>

            <div className="text-center pt-3 border-t border-slate-800 mt-4">
              {authModal === 'login' ? (
                <button type="button" onClick={() => setAuthModal('register')} className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">Establish New Identity?</button>
              ) : (
                <button type="button" onClick={() => setAuthModal('login')} className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">Existing Identity Login</button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderTopUpModal = () => {
    if (!topUpModalOpen) return null;

    const inrValue = (topUpAmount * 100).toLocaleString('en-IN');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=prajjwal5655@okicici%26pn=Prajjwal%20Maurya%26am=${topUpAmount * 100}%26cu=INR`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4" onClick={(e) => { if(e.target === e.currentTarget) { setTopUpModalOpen(false); setTopUpReceipt(null); } }}>
        <div className="bg-slate-950 border border-amber-500/40 rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative">
          
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Coins className="text-amber-400 w-5 h-5" />
              <h2 className="text-lg font-mono font-bold text-white tracking-widest uppercase">
                Buy CULT Coins
              </h2>
            </div>
            <button onClick={() => { setTopUpModalOpen(false); setTopUpReceipt(null); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          {topUpReceipt ? (
            <div className="p-6 space-y-5 font-mono">
              <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-white font-bold text-base uppercase">Payment Verified & Credited</h3>
                <p className="text-emerald-400 text-xs">+{topUpReceipt.cultCredited} CULT Coins added to @{topUpReceipt.username}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Top-Up Serial:</span>
                  <span className="text-cyan-400 font-bold">{topUpReceipt.receiptId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>12-Digit UTR:</span>
                  <span className="text-amber-400 font-bold">{topUpReceipt.utrRef}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amount Paid:</span>
                  <span className="text-white font-bold">₹{topUpReceipt.inrPaid.toLocaleString('en-IN')} INR</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recipient:</span>
                  <span className="text-white">{topUpReceipt.recipientName} ({topUpReceipt.recipientUPI})</span>
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
            <form onSubmit={handleTopUpSubmit} className="p-6 space-y-4">
              <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-3 text-xs font-mono text-amber-300 flex items-center justify-between">
                <span>Rate: 1 CULT = $1 USD = ₹100 INR</span>
                <Sparkles className="w-4 h-4 text-amber-400"/>
              </div>

              {topUpError && (
                <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-3 rounded-lg text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0"/> {topUpError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Select CULT Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 25, 50, 100].map(amt => (
                    <button key={amt} type="button" onClick={() => setTopUpAmount(amt)} className={`py-2 rounded-lg font-mono text-xs border transition-all ${topUpAmount === amt ? 'bg-amber-500 text-black font-bold border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'}`}>
                      +{amt} CULT
                    </button>
                  ))}
                </div>

                <input 
                  type="number" 
                  min="1" 
                  value={topUpAmount} 
                  onChange={e => setTopUpAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-black border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center space-y-3">
                <div className="text-xs font-mono text-slate-400">
                  Scan to pay <strong className="text-amber-400 font-bold">₹{inrValue} INR</strong> via UPI
                </div>

                <div className="w-40 h-40 bg-white p-2 mx-auto rounded-lg border-2 border-amber-500/60 shadow-xl flex items-center justify-center">
                  <img src={qrUrl} alt="Prajjwal Maurya UPI QR Code" className="w-full h-full object-contain" />
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Recipient: <strong className="text-white">Prajjwal Maurya</strong><br/>
                  <code className="text-amber-400">prajjwal5655@okicici</code>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">Enter 12-Digit UPI Ref / UTR Number *</label>
                <input 
                  required
                  type="text" 
                  maxLength="12"
                  placeholder="e.g. 423987123901" 
                  value={utrInput} 
                  onChange={e => { setUtrInput(e.target.value.replace(/\D/g, '')); setTopUpError(''); }}
                  className="w-full bg-black border border-amber-500/50 rounded-lg px-4 py-2 text-amber-300 font-mono text-sm tracking-widest focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[9px] text-slate-500 font-mono block mt-1">Must be exactly 12 numeric digits from your GPay / PhonePe / Paytm receipt.</span>
              </div>

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-all">
                Verify UTR & Credit +{topUpAmount} CULT
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  const renderUserProfileModal = () => {
    if (!userProfileModal) return null;
    
    const isMe = user?.username === userProfileModal;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setUserProfileModal(null); }}>
        <div className="bg-black border border-slate-700 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
          <div className="p-6 text-center border-b border-slate-800 relative">
            <button onClick={() => setUserProfileModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-800 mb-4">
              <Terminal className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-xl font-mono font-bold text-white flex items-center justify-center gap-2">
              @{userProfileModal}
            </h2>
          </div>
          
          <div className="p-4 bg-slate-900/50 space-y-3">
            {!isMe && user && (
              <button 
                onClick={() => openPrivateChat(userProfileModal)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-mono py-3 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Start Encrypted Chat
              </button>
            )}
            {!user && (
              <p className="text-xs text-center font-mono text-slate-500 p-2">Authenticate to interact with this entity.</p>
            )}
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

    const chatTitle = isGlobal ? 'Global Hostel Relay' : `Private Comm: @${activePrivateChat}`;
    
    return (
      <div className="max-w-4xl mx-auto bg-black border border-slate-800 rounded-xl flex flex-col h-[75vh] shadow-2xl relative overflow-hidden">
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {isGlobal ? <Globe className="w-5 h-5 text-cyan-500" /> : <Lock className="w-5 h-5 text-emerald-500" />}
            <div>
              <h3 className="text-white font-mono font-bold tracking-wide">{chatTitle}</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-2">
                {wsConnected ? <span className="text-emerald-400 flex items-center gap-1"><Wifi className="w-3 h-3"/> Connected</span> : <span className="text-rose-400 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Connecting...</span>}
                | AES-256-GCM Encrypted
              </p>
            </div>
          </div>
        </div>

        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 relative"
        >
          {messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-mono text-xs uppercase tracking-widest">
              No chat transmissions in room.
            </div>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user?.username;
            const cacheKey = `${chatRoomId}_${msg.text}`;
            const plainText = decryptedCache[cacheKey] || msg.text;

            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="max-w-[75%]">
                  {!isMe && (
                    <span 
                      onClick={() => setUserProfileModal(msg.sender)}
                      className="text-[10px] font-mono text-cyan-600 mb-1 block cursor-pointer hover:text-cyan-400 ml-1"
                    >
                      @{msg.sender}
                    </span>
                  )}
                  <div className={`p-3 rounded-2xl text-sm font-mono leading-relaxed ${isMe ? 'bg-cyan-950 text-cyan-50 rounded-tr-sm border border-cyan-900' : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'}`}>
                    {plainText}
                  </div>
                  <span className={`text-[9px] font-mono text-slate-600 mt-1 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
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
              placeholder="Type encrypted message..." 
              className="flex-1 bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm placeholder:text-slate-700"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="bg-cyan-950 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 border border-cyan-800 p-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {renderAuthModal()}
      {renderTopUpModal()}
      {renderUserProfileModal()}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-lg font-mono text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-xl tracking-widest cursor-pointer" onClick={() => setActiveView('marketplace')}>
                <Shield className="w-6 h-6 text-cyan-500" />
                <span>NEXUS<span className="text-cyan-500 opacity-70">MARKET</span></span>
            </div>
            
            <div className="hidden md:flex gap-6 font-mono text-sm uppercase tracking-wider">
                <button onClick={() => setActiveView('marketplace')} className={`h-16 px-2 flex items-center transition-colors ${activeView === 'marketplace' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>Market</button>
                <button 
                  onClick={() => user ? setActiveView('global_chat') : setAuthModal('login')} 
                  className={`h-16 px-2 flex items-center gap-2 transition-colors ${activeView === 'global_chat' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}
                >
                  <Globe className="w-4 h-4"/> Global Chat
                </button>
                {user && (
                  <button onClick={() => setActiveView('my_orders')} className={`h-16 px-2 flex items-center gap-2 transition-colors ${activeView === 'my_orders' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                    <Package className="w-4 h-4"/> Orders
                  </button>
                )}
                {user?.role === 'seller' && (
                  <button onClick={() => setActiveView('dashboard')} className={`h-16 px-2 flex items-center gap-2 transition-colors ${activeView === 'dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}>
                    <Terminal className="w-4 h-4"/> Vendor Console
                  </button>
                )}
            </div>

            <div className="flex items-center gap-4">
              {/* CULT Wallet Widget */}
              {user && (
                <div className="flex items-center bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 font-mono text-xs gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-amber-400 font-bold">{cultBalance.toFixed(2)} CULT</span>
                    <span className="text-[10px] text-slate-500 block">≈ ₹{(cultBalance * 100).toLocaleString('en-IN')}</span>
                  </div>
                  <button 
                    onClick={() => setTopUpModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-2 py-1 rounded transition-colors ml-1"
                  >
                    + Buy CULT
                  </button>
                </div>
              )}

              <button onClick={() => setActiveView('cart')} className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-black font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block cursor-pointer group" onClick={() => setUserProfileModal(user.username)}>
                    <div className="font-mono font-bold text-white flex items-center gap-1 justify-end group-hover:text-cyan-400 transition-colors">
                      @{user.username}
                    </div>
                    <div className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">{user.role}</div>
                  </div>
                  <button onClick={logout} className="text-[10px] uppercase tracking-widest font-mono text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900 px-2 py-1 rounded">Logout</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setAuthModal('login')} className="px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Auth</button>
                  <button onClick={() => setAuthModal('register')} className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all">Register</button>
                </div>
              )}
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Marketplace View */}
        {activeView === 'marketplace' && (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight font-mono uppercase">Secure Marketplace</h2>
                      <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-widest">Hostel network P2P commerce with CULT escrow.</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400 bg-amber-950/20 px-3 py-1.5 rounded border border-amber-900/50 uppercase tracking-widest">
                      <Coins className="w-3.5 h-3.5" /> 1 CULT = $1 USD = ₹100 INR
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col hover:border-slate-600 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-cyan-500 transition-colors"></div>
                            
                            <div className="flex justify-between items-start mb-4 pl-3">
                              <h3 className="text-lg font-bold text-white leading-tight font-mono">{item.title}</h3>
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-6 flex-1 pl-3 font-mono leading-relaxed">{item.desc}</p>
                            
                            <div className="flex items-center justify-between mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800 ml-3">
                                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                  Vendor<br/>
                                  <button onClick={() => setUserProfileModal(item.seller)} className="text-cyan-500 hover:text-cyan-300 transition-colors mt-1 font-bold">
                                    @{item.seller}
                                  </button>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Cost</span><br/>
                                  <span className="text-lg font-bold text-amber-400 font-mono">{item.price} <span className="text-xs text-amber-500">{item.currency || 'CULT'}</span></span>
                                  <span className="text-[10px] text-slate-500 block font-mono">≈ ₹{(parseFloat(item.price) * 100).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            
                            <div className="mt-auto pl-3 grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => addToCart(item)}
                                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5"/> Cart
                                </button>
                                <button 
                                    onClick={() => {
                                      addToCart(item);
                                      if (!user) {
                                        setAuthModal('login');
                                      } else {
                                        setActiveView('cart');
                                      }
                                    }}
                                    className="bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1 font-bold"
                                >
                                    <Lock className="w-3.5 h-3.5"/> Buy Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Cart View */}
        {activeView === 'cart' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <button onClick={() => setActiveView('marketplace')} className="text-slate-500 hover:text-white font-mono text-xs flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Marketplace
            </button>
            <h2 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="text-cyan-400" /> Shopping Cart
            </h2>

            {cart.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center space-y-4">
                <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="font-mono text-slate-500 text-sm">Your cart is currently empty.</p>
                <button onClick={() => setActiveView('marketplace')} className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-6 py-2 rounded-lg font-mono text-xs uppercase tracking-widest">Browse Marketplace</button>
              </div>
            ) : (
              <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="space-y-4 divide-y divide-slate-800">
                  {cart.map(item => (
                    <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-mono font-bold text-white">{item.title}</h4>
                        <p className="font-mono text-xs text-slate-500">Vendor: @{item.seller} | {item.price} CULT (≈ ₹{parseFloat(item.price) * 100})</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-950 font-mono text-xs">
                          <button onClick={() => updateCartQty(item.id, -1)} className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800">-</button>
                          <span className="px-3 py-1 text-white">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800">+</button>
                        </div>
                        <span className="font-mono text-sm font-bold text-amber-400 w-24 text-right">
                          {(parseFloat(item.price) * item.qty).toFixed(2)} CULT
                        </span>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-rose-400"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-6 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 font-mono text-xs uppercase tracking-widest block">Total Escrow Value</span>
                    <span className="text-2xl font-mono font-bold text-amber-400">{cartTotalCULT} CULT</span>
                    <span className="text-xs font-mono text-slate-400 block">≈ ₹{cartTotalINR} INR</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (!user) {
                        setAuthModal('login');
                      } else {
                        setActiveView('checkout_address');
                      }
                    }}
                    className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2"
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
          <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => setActiveView('cart')} className="text-slate-500 hover:text-white font-mono text-xs flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Cart
            </button>
            
            <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
                <MapPin className="text-cyan-400" /> Shipping & Contact Details
              </h3>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Full Name *</label>
                    <input required type="text" value={shippingForm.fullName} onChange={e => setShippingForm({...shippingForm, fullName: e.target.value})} placeholder="Hostel Resident Name" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Phone Number *</label>
                    <input required type="tel" value={shippingForm.phone} onChange={e => setShippingForm({...shippingForm, phone: e.target.value})} placeholder="+91 9876543210" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Hostel Block & Room / Delivery Address *</label>
                  <input required type="text" value={shippingForm.address} onChange={e => setShippingForm({...shippingForm, address: e.target.value})} placeholder="Room 302, Block B, Hostel Campus" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">City / Campus *</label>
                    <input required type="text" value={shippingForm.city} onChange={e => setShippingForm({...shippingForm, city: e.target.value})} placeholder="Greater Noida" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Postal Pin Code</label>
                    <input type="text" value={shippingForm.postalCode} onChange={e => setShippingForm({...shippingForm, postalCode: e.target.value})} placeholder="201310" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 py-3 rounded-lg font-mono text-xs uppercase tracking-widest font-bold mt-4">
                  Continue to Payment Options
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Payment View */}
        {activeView === 'checkout_payment' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => setActiveView('checkout_address')} className="text-slate-500 hover:text-white font-mono text-xs flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Shipping Address
            </button>

            <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
                <CreditCard className="text-cyan-400" /> Select Payment Rail
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    onClick={() => setPaymentMethod('cult_wallet')}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${paymentMethod === 'cult_wallet' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <Coins className={`w-5 h-5 ${paymentMethod === 'cult_wallet' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-mono text-xs font-bold text-white">CULT Wallet</div>
                      <div className="font-mono text-[9px] text-amber-400">{cultBalance.toFixed(1)} CULT avail.</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('qr_code')}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${paymentMethod === 'qr_code' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <QrCode className={`w-5 h-5 ${paymentMethod === 'qr_code' ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-mono text-xs font-bold text-white">UPI / GPay</div>
                      <div className="font-mono text-[9px] text-slate-500">Prajjwal Maurya</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('web3')}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${paymentMethod === 'web3' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <Wallet className={`w-5 h-5 ${paymentMethod === 'web3' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-mono text-xs font-bold text-white">Web3 Lock</div>
                      <div className="font-mono text-[9px] text-slate-500">MetaMask ETH</div>
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === 'cult_wallet' && (
                <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-5 text-center space-y-2">
                  <Coins className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="font-mono text-xs text-slate-300">Deducting <strong className="text-amber-400 font-bold">{cartTotalCULT} CULT</strong> from your CULT Virtual Wallet.</p>
                  <p className="font-mono text-[10px] text-slate-500">Remaining Balance after order: <strong className="text-white">{(cultBalance - parseFloat(cartTotalCULT)).toFixed(2)} CULT</strong></p>
                </div>
              )}

              {paymentMethod === 'qr_code' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">Scan with Google Pay, PhonePe, or Paytm</span>
                    <strong className="text-white font-mono text-sm block">Prajjwal Maurya</strong>
                    <code className="text-cyan-400 font-mono text-xs block bg-black py-1 px-3 rounded inline-block border border-slate-800">prajjwal5655@okicici</code>
                  </div>

                  <div className="w-48 h-48 bg-white p-3 mx-auto rounded-xl shadow-2xl flex items-center justify-center border-2 border-cyan-500/50">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=prajjwal5655@okicici%26pn=Prajjwal%20Maurya%26am=${cartTotalINR}%26cu=INR`} 
                      alt="Prajjwal Maurya UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-slate-900">
                    <p className="font-mono text-xs text-slate-400">Total Amount to Pay: <strong className="text-emerald-400 font-bold text-sm">₹{cartTotalINR} INR</strong> ({cartTotalCULT} CULT)</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'web3' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                  <Wallet className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="font-mono text-xs text-slate-400">Smart Contract: <code className="text-emerald-400">0x71C...39A</code></p>
                  <p className="font-mono text-[11px] text-slate-500">Locking {cartTotalCULT} CULT value in decentralized escrow contract.</p>
                </div>
              )}

              <button 
                onClick={processOrderPayment}
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 py-3.5 rounded-lg font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4"/> Confirm Order & Lock Escrow
              </button>
            </div>
          </div>
        )}

        {/* Order Confirmed Receipt View */}
        {activeView === 'order_confirmed' && lastOrder && lastReceipt && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-black border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"></div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-xl tracking-widest">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <span>NEXUS<span className="text-emerald-400">RECEIPT</span></span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Official Escrow Transaction Record</p>
                </div>
                <div className="text-right font-mono">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider block">
                    {lastReceipt.status}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">{lastReceipt.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
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
                  <span className="text-white">{lastReceipt.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-widest">Payment Rail</span>
                  <span className="text-amber-400">{lastReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Itemized Purchase Summary</span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 font-mono text-xs">
                  {lastReceipt.items.map((item, i) => (
                    <div key={i} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="text-white font-bold">{item.title}</span>
                        <span className="text-[10px] text-slate-500 block">Vendor: @{item.seller} | Qty: {item.qty}</span>
                      </div>
                      <span className="text-amber-400 font-bold">{item.subtotal} CULT</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-between items-center font-mono">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-widest block">Total Paid</span>
                  <span className="text-2xl font-bold text-amber-400">{lastReceipt.totalCULT} CULT</span>
                  <span className="text-xs text-slate-400 block">≈ ₹{lastReceipt.totalINR} INR</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4"/> Print / PDF
                  </button>
                  <button 
                    onClick={() => setActiveView('marketplace')}
                    className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest font-bold"
                  >
                    Marketplace
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Orders History View */}
        {activeView === 'my_orders' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
              <Package className="text-cyan-400" /> Order History & Receipts
            </h2>

            {db.orders.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
                No active or past orders found.
              </div>
            ) : (
              <div className="space-y-4">
                {db.orders.map(order => (
                  <div key={order.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-cyan-400 font-bold text-sm">{order.id}</span>
                      <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900">{order.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Total: <strong className="text-amber-400">{order.total} CULT</strong></span>
                      <span>{order.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'global_chat' && renderChatInterface('global')}
        {activeView === 'private_chat' && renderChatInterface('private')}

        {/* Seller Vendor Console */}
        {activeView === 'dashboard' && user?.role === 'seller' && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-emerald-500" /> Vendor Console
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-black border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 to-emerald-500"></div>
                  <h3 className="text-sm font-mono font-bold text-emerald-500 mb-6 uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Deploy Listing</h3>
                  
                  <form onSubmit={handleDeployListing} className="space-y-4">
                    <input required type="text" value={newProduct.title} onChange={e=>setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm" placeholder="Title..." />
                    <input required type="number" step="1" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm" placeholder="Price (CULT)..." />
                    <textarea required value={newProduct.desc} onChange={e=>setNewProduct({...newProduct, desc: e.target.value})} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm resize-none" placeholder="Description..."></textarea>
                    <button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-mono font-bold py-3 rounded-lg text-xs tracking-widest uppercase">Publish Product</button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                  {items.filter(item => item.seller === user.username).map(item => (
                    <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white font-mono">{item.title}</h4>
                        <p className="text-xs text-amber-400 font-mono mt-1">{item.price} CULT (≈ ₹{parseFloat(item.price) * 100})</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/30 px-3 py-1 rounded border border-emerald-900 uppercase tracking-widest">Active</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}