import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, ShieldCheck, Lock, Mail, User, Eye, EyeOff, 
  ShoppingCart, Tag, PlusCircle, Globe, Wallet, CheckCircle, CheckCircle2,
  AlertTriangle, MessageSquare, Send, X, UserPlus, UserCheck, Terminal,
  MapPin, Phone, CreditCard, QrCode, ArrowRight, Trash2, ChevronLeft, Package,
  Wifi, WifiOff, Key, RefreshCw, Printer, Coins, Sparkles, Download, FileText,
  Search, Star, Award, Layers, HelpCircle, Users, Image, Video, Music, Mic,
  Paperclip, Radio, Play, Pause, EyeOff as EyeClosed, Lock as LockIcon
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
  const isProduction = host.includes('vercel.app') || host.includes('onrender.com');

  const apiBaseUrl = isProduction 
    ? 'https://nexus-secure-backend.onrender.com' 
    : `http://${host}:8000`;

  const wsBaseUrl = isProduction 
    ? 'wss://nexus-secure-backend.onrender.com' 
    : `ws://${host}:8000`;

  const [db, setDb] = useState({
    globalMessages: [],
    privateMessages: {},
    groupMessages: {},
    orders: []
  });

  const [decryptedCache, setDecryptedCache] = useState({});
  const [activeView, setActiveView] = useState('marketplace'); 
  const [authModal, setAuthModal] = useState(null); 
  const [userProfileModal, setUserProfileModal] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [activeGroupChat, setActiveGroupChat] = useState(null);
  
  const [myGroups, setMyGroups] = useState([]);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);
  const [inviteTargetUser, setInviteTargetUser] = useState('');

  const [audioVaultList, setAudioVaultList] = useState([]);
  const [newAudioForm, setNewAudioForm] = useState({ title: '', audioUrl: '', docUrl: '', category: 'Voice Story', desc: '' });
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState(null);

  const [proUtrInput, setProUtrInput] = useState('');
  const [proUtrError, setProUtrError] = useState('');

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [cultBalance, setCultBalance] = useState(0.0);
  const [isPro, setIsPro] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newAvatarInput, setNewAvatarInput] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suggestions, setSuggestions] = useState([]);
  
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
  const [shippingErrors, setShippingErrors] = useState({});
  const [checkoutUtrInput, setCheckoutUtrInput] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('cult_wallet');
  const [lastOrder, setLastOrder] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '', confirmPassword: '', role: 'buyer' });
  const [authError, setAuthError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');

  const globalWsRef = useRef(null);
  const privateWsRef = useRef(null);
  const groupWsRef = useRef(null);
  const chatScrollRef = useRef(null);

  const [items, setItems] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', desc: '', category: 'Hardware' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchMarketItems = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/items`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch (err) {}
  };

  const fetchAudioVault = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/audio-vault`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAudioVaultList(data);
      }
    } catch (err) {}
  };

  const fetchMyGroups = async (token) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/my-groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMyGroups(data);
      }
    } catch (err) {}
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
    } catch (err) {}
  };

  const fetchUserOrders = async (username, token) => {
    if (!username || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/orders/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDb(prev => ({ ...prev, orders: data }));
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchMarketItems();
    fetchAudioVault();
    const interval = setInterval(() => {
      fetchMarketItems();
      fetchAudioVault();
    }, 5000);
    return () => clearInterval(interval);
  }, [host, apiBaseUrl]);

  useEffect(() => {
    if (user && user.token) {
      localStorage.setItem('nexus_user', JSON.stringify(user));
      setIsPro(user.isPro || false);
      setIsPrivate(user.isPrivate || false);
      setAvatarUrl(user.avatarUrl || '');
      fetchWalletBalance(user.username, user.token);
      fetchUserOrders(user.username, user.token);
      fetchMyGroups(user.token);
    } else {
      localStorage.removeItem('nexus_user');
      setCultBalance(0.0);
      setIsPro(false);
      setIsPrivate(false);
      setAvatarUrl('');
    }
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = new Set();
    items.forEach(item => {
      if (item.title.toLowerCase().includes(q)) matches.add(item.title);
      if (item.seller.toLowerCase().includes(q)) matches.add(`@${item.seller}`);
      if (item.category && item.category.toLowerCase().includes(q)) matches.add(item.category);
    });
    setSuggestions(Array.from(matches).slice(0, 5));
  }, [searchQuery, items]);

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

        ws.onopen = () => setWsConnected(true);

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
          } catch (e) {}
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
      } catch (err) {}
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
          } catch (e) {}
        };

        privateWsRef.current = ws;
      } catch (err) {}
    };

    connectPrivateWS();

    return () => {
      if (privateWsRef.current) privateWsRef.current.close();
    };
  }, [user, activePrivateChat, activeView, host, wsBaseUrl]);

  useEffect(() => {
    if (!user || !user.token || !activeGroupChat || activeView !== 'group_chat') return;

    const connectGroupWS = () => {
      try {
        const ws = new WebSocket(`${wsBaseUrl}/ws/chat/group/${activeGroupChat.id}?token=${user.token}`);

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            setDb(prev => {
              const existing = prev.groupMessages[activeGroupChat.id] || [];
              if (existing.some(m => m.id === data.id && m.timestamp === data.timestamp)) {
                return prev;
              }
              const updated = [...existing, data];
              processDecryption(updated, activeGroupChat.id);
              return {
                ...prev,
                groupMessages: {
                  ...prev.groupMessages,
                  [activeGroupChat.id]: updated
                }
              };
            });
          } catch (e) {}
        };

        groupWsRef.current = ws;
      } catch (err) {}
    };

    connectGroupWS();

    return () => {
      if (groupWsRef.current) groupWsRef.current.close();
    };
  }, [user, activeGroupChat, activeView, host, wsBaseUrl]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [db.globalMessages, db.privateMessages, db.groupMessages, activeView, activePrivateChat, activeGroupChat]);

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

  const validateShippingForm = () => {
    const errors = {};
    if (!shippingForm.fullName || shippingForm.fullName.trim().length < 2) {
      errors.fullName = "Enter a valid full name (at least 2 letters).";
    }
    
    const cleanPhone = shippingForm.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = "Must be a valid 10-digit phone number (e.g., 9876543210).";
    }

    if (!shippingForm.address || shippingForm.address.trim().length < 5) {
      errors.address = "Enter a complete hostel block & room address (min 5 chars).";
    }

    if (!shippingForm.city || shippingForm.city.trim().length < 2) {
      errors.city = "City / Campus name is required.";
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (validateShippingForm()) {
      setActiveView('checkout_payment');
    } else {
      showToast("Please fix the errors in your shipping details.");
    }
  };

  const processOrderPayment = async () => {
    setCheckoutError('');
    const totalNum = parseFloat(cartTotalCULT);

    if (paymentMethod === 'cult_wallet' && cultBalance < totalNum) {
      setCheckoutError(`Insufficient CULT Balance! Available: ${cultBalance} CULT. Required: ${totalNum} CULT.`);
      return;
    }

    if (paymentMethod === 'qr_code') {
      const cleanUtr = checkoutUtrInput.trim();
      if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        setCheckoutError("Invalid UTR. Please enter the exact 12-digit numeric UPI Ref / UTR / RRN from your GPay / PhonePe / Paytm receipt.");
        return;
      }
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
      paymentMethod: paymentMethod === 'cult_wallet' ? 'CULT Virtual Wallet' : paymentMethod === 'qr_code' ? `UPI QR (UTR: ${checkoutUtrInput.trim()})` : 'Web3 Escrow',
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
      receipt: receiptObj,
      utrRef: paymentMethod === 'qr_code' ? checkoutUtrInput.trim() : null
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
        setCheckoutError(err.detail || "Order processing failed.");
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
    setCheckoutUtrInput('');
    setActiveView('order_confirmed');
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    setTopUpError('');

    if (!user) return;
    const cleanUtr = utrInput.trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      setTopUpError("Invalid UTR Reference. Enter the exact 12-digit numeric UPI Ref / UTR / RRN from your payment app receipt.");
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

      setCultBalance(data.cultBalance);
      setTopUpReceipt(data.receipt);
      showToast(`UTR Verified! Credited +${topUpAmount} CULT Coins to your wallet.`);
      setUtrInput('');
    } catch (err) {
      setTopUpError("Backend verification request failed. Ensure server is online.");
    }
  };

  const handleUpgradeProCULT = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/user/upgrade-pro`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || "Upgrade failed.");
        return;
      }
      setCultBalance(data.cultBalance);
      setIsPro(true);
      setUser(prev => ({ ...prev, isPro: true }));
      showToast("Node successfully upgraded to PRO Status!");
    } catch (err) {
      showToast("Backend connection error.");
    }
  };

  const handleUpgradeProUTR = async (e) => {
    e.preventDefault();
    setProUtrError('');
    if (!user) return;

    const cleanUtr = proUtrInput.trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      setProUtrError("Invalid UTR Reference. Enter the 12-digit numeric code from your UPI app.");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/user/upgrade-pro-utr`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          username: user.username,
          utr_ref: cleanUtr
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setProUtrError(data.detail || "UTR verification failed.");
        return;
      }

      setIsPro(true);
      setUser(prev => ({ ...prev, isPro: true }));
      setProUtrInput('');
      showToast("UPI Payment Verified! Your Node is upgraded to PRO status.");
    } catch (err) {
      setProUtrError("Backend request failed.");
    }
  };

  const handleTogglePrivacy = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/user/toggle-privacy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIsPrivate(data.isPrivate);
        setUser(prev => ({ ...prev, isPrivate: data.isPrivate }));
        showToast(`Account privacy updated to ${data.isPrivate ? 'PRIVATE' : 'PUBLIC'}`);
      }
    } catch (err) {}
  };

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!user || !newAvatarInput.trim()) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/user/update-avatar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ avatarUrl: newAvatarInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl);
        setUser(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        setNewAvatarInput('');
        showToast("Profile avatar photo updated!");
      }
    } catch (err) {}
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name: newGroupName.trim(), initial_members: [] })
      });
      const data = await res.json();
      if (res.ok) {
        setNewGroupName('');
        setCreateGroupModalOpen(false);
        fetchMyGroups(user.token);
        showToast(`Group "${data.name}" created!`);
      }
    } catch (err) {}
  };

  const handleInviteToGroup = async (e) => {
    e.preventDefault();
    if (!inviteTargetUser.trim() || !activeGroupChat || !user) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/groups/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ group_id: activeGroupChat.id, target_username: inviteTargetUser.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteTargetUser('');
        setInviteUserModalOpen(false);
        fetchMyGroups(user.token);
        showToast(`User @${data.invitedUser} added to group!`);
      }
    } catch (err) {}
  };

  const handlePublishAudioVault = async (e) => {
    e.preventDefault();
    if (!newAudioForm.title || !newAudioForm.audioUrl || !user) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/audio-vault`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newAudioForm)
      });
      if (res.ok) {
        fetchAudioVault();
        setNewAudioForm({ title: '', audioUrl: '', docUrl: '', category: 'Voice Story', desc: '' });
        showToast("Audio track / Voice story published to Studio Vault!");
      }
    } catch (err) {}
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
        email: data.email,
        role: data.role,
        token: data.token,
        isPro: false,
        isPrivate: false,
        avatarUrl: ""
      });
      setCultBalance(0.0);
      setIsPro(false);
      setIsPrivate(false);
      setAvatarUrl("");
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
        isPro: userData.isPro || false,
        isPrivate: userData.isPrivate || false,
        avatarUrl: userData.avatarUrl || ""
      });
      setCultBalance(userData.cultBalance || 0.0);
      setIsPro(userData.isPro || false);
      setIsPrivate(userData.isPrivate || false);
      setAvatarUrl(userData.avatarUrl || "");

      setAuthModal(null);
      showToast(`Authenticated: @${userData.username}`);
    } catch (err) {
      setAuthError("Backend connection error.");
    }
  };

  const logout = () => {
    setUser(null);
    setCultBalance(0.0);
    setIsPro(false);
    setIsPrivate(false);
    setAvatarUrl("");
    localStorage.removeItem('nexus_user');
    setActiveView('marketplace');
  };

  const sendChatMessage = async (e, type) => {
    e.preventDefault();
    if ((!chatInput.trim() && !mediaUrl.trim()) || !user) return;
    
    let roomId = 'global';
    let wsRef = globalWsRef;

    if (type === 'private') {
      roomId = getPrivateChatKey(user.username, activePrivateChat);
      wsRef = privateWsRef;
    } else if (type === 'group') {
      roomId = activeGroupChat.id;
      wsRef = groupWsRef;
    }

    const encryptedText = await encryptText(chatInput || '[Media Attachment]', roomId);
    const newMsg = {
      id: Date.now(),
      sender: user.username,
      text: encryptedText,
      media_type: mediaType,
      media_url: mediaUrl,
      timestamp: new Date().toISOString()
    };
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(newMsg));
    }

    setChatInput('');
    setMediaUrl('');
    setMediaType('text');
  };

  const handleDeployListing = async (e) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price || !user) return;

    const itemPayload = {
      title: newProduct.title,
      price: newProduct.price.toString(),
      currency: 'CULT',
      seller: user.username,
      seller_email: user.email || '',
      state: 'Available',
      desc: newProduct.desc || 'No description provided.',
      category: newProduct.category || 'Hardware'
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
    } catch (err) {}

    setNewProduct({ title: '', price: '', desc: '', category: 'Hardware' });
    showToast("New item listed on hostel marketplace!");
  };

  const openUserProfileModal = async (targetUsername) => {
    setUserProfileModal(targetUsername);
    setProfileData(null);
    try {
      const headers = user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
      const res = await fetch(`${apiBaseUrl}/api/user/profile/${targetUsername}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (err) {}
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
        <div className="bg-black border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl font-mono">
          <div className="p-6 border-b border-slate-800 relative bg-slate-900/50 text-center">
            <button onClick={() => setUserProfileModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700 mb-2 overflow-hidden bg-slate-950">
              {profileData?.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <Terminal className="w-8 h-8 text-cyan-400" />
              )}
            </div>

            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              @{userProfileModal}
              {profileData?.isPro && <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded uppercase">PRO NODE</span>}
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Role: {profileData?.role || 'User'}</p>
            
            {profileData?.email && profileData.email !== "HIDDEN (PRIVATE NODE)" && (
              <a href={`mailto:${profileData.email}`} className="text-[11px] text-cyan-400 hover:underline flex items-center justify-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5"/> {profileData.email}
              </a>
            )}
          </div>
          
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {isMe && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center justify-between">
                  <span>Node Privacy & Customization</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded ${isPrivate ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                    {isPrivate ? 'PRIVATE' : 'PUBLIC'}
                  </span>
                </h4>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Profile Visibility</span>
                  <button onClick={handleTogglePrivacy} className="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1 rounded text-white text-[11px] uppercase">
                    Toggle to {isPrivate ? 'Public' : 'Private'}
                  </button>
                </div>

                <form onSubmit={handleUpdateAvatar} className="space-y-2 pt-2 border-t border-slate-900">
                  <label className="text-[10px] text-slate-500 block">Avatar Photo Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="https://example.com/avatar.jpg" 
                      value={newAvatarInput} 
                      onChange={e => setNewAvatarInput(e.target.value)}
                      className="flex-1 bg-black border border-slate-800 rounded px-3 py-1 text-xs text-white focus:outline-none"
                    />
                    <button type="submit" className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-3 py-1 rounded text-xs">Save</button>
                  </div>
                </form>
              </div>
            )}

            {!profileData ? (
              <div className="text-center text-xs text-slate-500 py-4">Fetching profile telemetry...</div>
            ) : profileData.isPrivate ? (
              <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-6 text-center space-y-2">
                <LockIcon className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-rose-400 uppercase">Private Node Account</h4>
                <p className="text-xs text-slate-400">This user has set their profile to PRIVATE. Listed items and purchase history are hidden.</p>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-xs text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5"/> Listed Products ({profileData.listedItems?.length || 0})
                  </h4>
                  {profileData.listedItems?.length === 0 ? (
                    <p className="text-[11px] text-slate-600">No active products listed for sale.</p>
                  ) : (
                    <div className="space-y-2">
                      {profileData.listedItems?.map(item => (
                        <div key={item.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-white font-bold block">{item.title}</span>
                            <span className="text-[10px] text-slate-500">{item.category}</span>
                          </div>
                          <span className="text-amber-400 font-bold">{item.price} CULT</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5"/> Purchases Completed ({profileData.purchaseHistory?.length || 0})
                  </h4>
                  {profileData.purchaseHistory?.length === 0 ? (
                    <p className="text-[11px] text-slate-600">No purchase records found.</p>
                  ) : (
                    <div className="space-y-2">
                      {profileData.purchaseHistory?.map(ord => (
                        <div key={ord.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-cyan-400 font-bold block">{ord.id}</span>
                            <span className="text-[10px] text-slate-500">{ord.timestamp}</span>
                          </div>
                          <span className="text-emerald-400 font-bold">{ord.total} CULT</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {!isMe && user && (
              <button 
                onClick={() => openPrivateChat(userProfileModal)}
                className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-mono py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <MessageSquare className="w-4 h-4" /> Start Direct Encrypted Comms
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChatInterface = (type) => {
    const isGlobal = type === 'global';
    const isGroup = type === 'group';

    let chatRoomId = 'global';
    let chatTitle = 'Global Hostel Relay';

    if (type === 'private') {
      chatRoomId = getPrivateChatKey(user?.username, activePrivateChat);
      chatTitle = `Private Comm: @${activePrivateChat}`;
    } else if (isGroup) {
      chatRoomId = activeGroupChat?.id;
      chatTitle = `Group Relay: ${activeGroupChat?.name}`;
    }

    const messages = isGlobal 
      ? db.globalMessages 
      : isGroup 
      ? (db.groupMessages[chatRoomId] || []) 
      : (db.privateMessages[chatRoomId] || []);

    return (
      <div className="max-w-4xl mx-auto bg-black border border-slate-800 rounded-xl flex flex-col h-[78vh] shadow-2xl relative overflow-hidden font-mono">
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {isGlobal ? <Globe className="w-5 h-5 text-cyan-500" /> : isGroup ? <Users className="w-5 h-5 text-amber-500" /> : <Lock className="w-5 h-5 text-emerald-500" />}
            <div>
              <h3 className="text-white font-bold tracking-wide">{chatTitle}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                {wsConnected ? <span className="text-emerald-400 flex items-center gap-1"><Wifi className="w-3 h-3"/> Connected</span> : <span className="text-rose-400 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Connecting...</span>}
                | AES-256-GCM Encrypted
              </p>
            </div>
          </div>

          {isGroup && (
            <button 
              onClick={() => setInviteUserModalOpen(true)}
              className="bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5"/> Invite Member
            </button>
          )}
        </div>

        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 relative"
        >
          {messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs uppercase tracking-widest">
              No chat transmissions in channel.
            </div>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user?.username;
            const cacheKey = `${chatRoomId}_${msg.text}`;
            const plainText = decryptedCache[cacheKey] || msg.text;

            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="max-w-[80%]">
                  {!isMe && (
                    <span 
                      onClick={() => openUserProfileModal(msg.sender)}
                      className="text-[10px] text-cyan-600 mb-1 block cursor-pointer hover:text-cyan-400 ml-1 font-bold"
                    >
                      @{msg.sender}
                    </span>
                  )}
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed space-y-2 ${isMe ? 'bg-cyan-950 text-cyan-50 rounded-tr-sm border border-cyan-900' : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'}`}>
                    <div>{plainText}</div>

                    {msg.media_type === 'image' && msg.media_url && (
                      <img src={msg.media_url} alt="Attached Media" className="max-w-full max-h-60 rounded-lg border border-slate-700 mt-2" />
                    )}

                    {msg.media_type === 'video' && msg.media_url && (
                      <video controls src={msg.media_url} className="max-w-full max-h-60 rounded-lg border border-slate-700 mt-2" />
                    )}

                    {msg.media_type === 'audio' && msg.media_url && (
                      <audio controls src={msg.media_url} className="w-full mt-2" />
                    )}

                    {msg.media_type === 'document' && msg.media_url && (
                      <a href={msg.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-amber-400 bg-black p-2 rounded border border-slate-800 hover:border-amber-500 mt-2">
                        <FileText className="w-4 h-4 shrink-0"/> Open / Download Document PDF
                      </a>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-600 mt-1 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 z-10 space-y-2">
          {mediaUrl && (
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex justify-between items-center text-xs">
              <span className="text-amber-400 truncate max-w-md">Attached [{mediaType.toUpperCase()}]: {mediaUrl}</span>
              <button onClick={() => setMediaUrl('')} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
            </div>
          )}

          <form onSubmit={(e) => sendChatMessage(e, type)} className="flex gap-2">
            <div className="flex items-center bg-black border border-slate-800 rounded-lg px-2">
              <select 
                value={mediaType} 
                onChange={e => setMediaType(e.target.value)}
                className="bg-transparent text-xs text-slate-400 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="image">Photo</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">PDF Doc</option>
              </select>
            </div>

            {mediaType !== 'text' && (
              <input 
                type="url" 
                value={mediaUrl} 
                onChange={e => setMediaUrl(e.target.value)} 
                placeholder={`Paste ${mediaType} URL link...`} 
                className="bg-black border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 w-48 focus:outline-none"
              />
            )}

            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type encrypted message..." 
              className="flex-1 bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm placeholder:text-slate-700"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() && !mediaUrl.trim()}
              className="bg-cyan-950 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 border border-cyan-800 p-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.seller.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {renderAuthModal()}
      {renderTopUpModal()}
      {renderUserProfileModal()}

      {/* Create Group Modal */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-black border border-amber-500/50 rounded-xl p-6 w-full max-w-md space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2"><Users className="text-amber-400"/> Create Group Channel</h3>
              <button onClick={() => setCreateGroupModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input 
                required 
                type="text" 
                placeholder="Group Name (e.g., Hostel Block C Gaming)" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest">
                Create Channel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member to Group Modal */}
      {inviteUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-black border border-cyan-500/50 rounded-xl p-6 w-full max-w-md space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2"><UserPlus className="text-cyan-400"/> Invite Member</h3>
              <button onClick={() => setInviteUserModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleInviteToGroup} className="space-y-4">
              <input 
                required 
                type="text" 
                placeholder="Target Username (e.g., NetNinja)" 
                value={inviteTargetUser} 
                onChange={e => setInviteTargetUser(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-bold py-3 rounded-lg text-xs uppercase tracking-widest">
                Send Group Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-lg font-mono text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <nav className="border-b border-slate-800 bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-xl tracking-widest cursor-pointer" onClick={() => setActiveView('marketplace')}>
                <Shield className="w-6 h-6 text-cyan-500" />
                <span>NEXUS<span className="text-cyan-500 opacity-70">MARKET</span></span>
            </div>
            
            <div className="hidden md:flex gap-5 font-mono text-xs uppercase tracking-wider">
                <button onClick={() => setActiveView('marketplace')} className={`h-16 px-2 flex items-center transition-colors ${activeView === 'marketplace' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>Market</button>
                <button onClick={() => user ? setActiveView('global_chat') : setAuthModal('login')} className={`h-16 px-2 flex items-center gap-1 transition-colors ${activeView === 'global_chat' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}><Globe className="w-3.5 h-3.5"/> Global</button>
                <button onClick={() => user ? setActiveView('groups_hub') : setAuthModal('login')} className={`h-16 px-2 flex items-center gap-1 transition-colors ${activeView === 'groups_hub' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-white'}`}><Users className="w-3.5 h-3.5"/> Groups ({myGroups.length})</button>
                <button onClick={() => setActiveView('audio_vault')} className={`h-16 px-2 flex items-center gap-1 transition-colors ${activeView === 'audio_vault' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}><Radio className="w-3.5 h-3.5"/> Audio Vault</button>
                {user && (
                  <button onClick={() => setActiveView('my_orders')} className={`h-16 px-2 flex items-center gap-1 transition-colors ${activeView === 'my_orders' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}><Package className="w-3.5 h-3.5"/> Orders</button>
                )}
                {user && (
                  <button onClick={() => setActiveView('pro_upgrade')} className={`h-16 px-2 flex items-center gap-1 transition-colors ${activeView === 'pro_upgrade' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-white'}`}><Sparkles className="w-3.5 h-3.5"/> PRO</button>
                )}
                {user?.role === 'seller' && (
                  <button onClick={() => setActiveView('dashboard')} className={`h-16 px-2 flex items-center gap-1 transition-colors ${activeView === 'dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}><Terminal className="w-3.5 h-3.5"/> Vendor</button>
                )}
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 font-mono text-xs gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-amber-400 font-bold">{cultBalance.toFixed(2)} CULT</span>
                    <span className="text-[10px] text-slate-500 block">≈ ₹{(cultBalance * 100).toLocaleString('en-IN')}</span>
                  </div>
                  <button onClick={() => setTopUpModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-2 py-1 rounded transition-colors ml-1">+ Buy</button>
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 cursor-pointer group" onClick={() => openUserProfileModal(user.username)}>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover"/> : <User className="w-4 h-4 text-cyan-400"/>}
                    </div>
                    <div className="text-right hidden sm:block font-mono">
                      <div className="font-bold text-white text-xs flex items-center gap-1 group-hover:text-cyan-400">
                        @{user.username}
                        {isPro && <span className="bg-amber-500 text-black text-[9px] font-bold px-1 rounded">PRO</span>}
                      </div>
                      <div className="text-slate-600 text-[9px] uppercase">{user.role}</div>
                    </div>
                  </div>
                  <button onClick={logout} className="text-[10px] uppercase tracking-widest font-mono text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900 px-2 py-1 rounded">Logout</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setAuthModal('login')} className="px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-white">Auth</button>
                  <button onClick={() => setAuthModal('register')} className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-widest">Register</button>
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

                <div className="relative font-mono">
                  <div className="relative flex items-center">
                    <Search className="w-5 h-5 absolute left-4 text-slate-500" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search hardware, VPN scripts, security tools, or @vendor..."
                      className="w-full bg-black border border-slate-800 rounded-xl pl-12 pr-10 py-3.5 text-white text-sm focus:border-cyan-500 focus:outline-none shadow-inner"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-4 text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                    )}
                  </div>

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-14 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 divide-y divide-slate-800/50 overflow-hidden">
                      {suggestions.map((s, idx) => (
                        <div key={idx} onClick={() => { setSearchQuery(s.replace(/^@/, '')); setSuggestions([]); }} className="p-3 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer flex items-center justify-between">
                          <span>{s}</span>
                          <span className="text-[10px] text-slate-600 uppercase">Match Keyword</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs">
                    {['All', 'Hardware', 'Privacy & VPN', 'Security Tools', 'Premium Services'].map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${selectedCategory === cat ? 'bg-cyan-950 text-cyan-400 border-cyan-800 font-bold' : 'bg-black text-slate-400 border-slate-800 hover:border-slate-700'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col hover:border-slate-600 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-cyan-500 transition-colors"></div>
                            
                            <div className="flex justify-between items-start mb-2 pl-3">
                              <h3 className="text-lg font-bold text-white leading-tight font-mono">{item.title}</h3>
                            </div>
                            
                            <div className="pl-3 mb-3">
                              <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                {item.category || 'Hardware'}
                              </span>
                            </div>

                            <p className="text-sm text-slate-400 mb-6 flex-1 pl-3 font-mono leading-relaxed">{item.desc}</p>
                            
                            <div className="flex items-center justify-between mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800 ml-3 font-mono">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                                  Vendor<br/>
                                  <button onClick={() => openUserProfileModal(item.seller)} className="text-cyan-500 hover:text-cyan-300 transition-colors mt-1 font-bold block">
                                    @{item.seller}
                                  </button>
                                  {item.seller_email && (
                                    <a href={`mailto:${item.seller_email}`} className="text-[9px] text-slate-400 hover:text-white underline block mt-0.5">
                                      Contact Email
                                    </a>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">Cost</span><br/>
                                  <span className="text-lg font-bold text-amber-400">{item.price} <span className="text-xs text-amber-500">{item.currency || 'CULT'}</span></span>
                                  <span className="text-[10px] text-slate-500 block">≈ ₹{(parseFloat(item.price) * 100).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            
                            <div className="mt-auto pl-3 grid grid-cols-2 gap-2 font-mono">
                                <button onClick={() => addToCart(item)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 py-3 rounded-lg text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1">
                                    <ShoppingCart className="w-3.5 h-3.5"/> Cart
                                </button>
                                <button onClick={() => { addToCart(item); if (!user) setAuthModal('login'); else setActiveView('cart'); }} className="bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 py-3 rounded-lg text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1 font-bold">
                                    <Lock className="w-3.5 h-3.5"/> Buy Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Groups Hub */}
        {activeView === 'groups_hub' && (
          <div className="max-w-4xl mx-auto space-y-6 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2"><Users className="text-amber-400"/> Group Channels</h2>
                <p className="text-xs text-slate-500 mt-1">Private multi-node encrypted chat channels.</p>
              </div>
              <button onClick={() => setCreateGroupModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest flex items-center gap-1">
                <PlusCircle className="w-4 h-4"/> Create Group
              </button>
            </div>

            {myGroups.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
                You are not in any group channels. Create one or ask an admin to invite you!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myGroups.map(grp => (
                  <div key={grp.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold text-base">{grp.name}</h3>
                        <p className="text-[10px] text-slate-500">Created by @{grp.createdBy} | {grp.createdAt}</p>
                      </div>
                      <span className="bg-slate-900 border border-slate-800 text-amber-400 text-[10px] px-2 py-0.5 rounded">{grp.members.length} Members</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Members: {grp.members.map(m => `@${m}`).join(', ')}
                    </div>

                    <button 
                      onClick={() => { setActiveGroupChat(grp); setActiveView('group_chat'); }}
                      className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4"/> Open Group Channel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Studio Audio Vault & Voice Hub */}
        {activeView === 'audio_vault' && (
          <div className="max-w-4xl mx-auto space-y-6 font-mono">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2"><Radio className="text-cyan-400"/> Nexus Studio Audio Vault</h2>
              <p className="text-xs text-slate-500 mt-1">Hostel radio streams, voice stories, podcasts, background music, and linked PDF documents.</p>
            </div>

            {user && (
              <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Publish Audio Track or Voice Story</h3>
                <form onSubmit={handlePublishAudioVault} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input required type="text" placeholder="Track / Story Title..." value={newAudioForm.title} onChange={e => setNewAudioForm({...newAudioForm, title: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"/>
                    <select value={newAudioForm.category} onChange={e => setNewAudioForm({...newAudioForm, category: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
                      <option value="Voice Story">Voice Story</option>
                      <option value="Podcast">Podcast</option>
                      <option value="Music">Music</option>
                      <option value="Lecture Note">Lecture Note</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input required type="url" placeholder="Direct Audio Stream URL (.mp3 / .wav)..." value={newAudioForm.audioUrl} onChange={e => setNewAudioForm({...newAudioForm, audioUrl: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"/>
                    <input type="url" placeholder="PDF Document URL (Optional)..." value={newAudioForm.docUrl} onChange={e => setNewAudioForm({...newAudioForm, docUrl: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"/>
                  </div>

                  <input type="text" placeholder="Description or summary..." value={newAudioForm.desc} onChange={e => setNewAudioForm({...newAudioForm, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"/>
                  <button type="submit" className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Publish to Studio Vault</button>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {audioVaultList.map(item => (
                <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-base">{item.title}</h3>
                      <p className="text-[10px] text-slate-500">By @{item.author} | Category: {item.category} | {item.timestamp}</p>
                    </div>
                    <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] px-2 py-0.5 rounded uppercase">{item.category}</span>
                  </div>

                  {item.desc && <p className="text-xs text-slate-400">{item.desc}</p>}

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <audio controls src={item.audioUrl} className="w-full" />
                  </div>

                  {item.docUrl && (
                    <a href={item.docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-amber-400 hover:underline">
                      <FileText className="w-4 h-4"/> View Linked PDF Document
                    </a>
                  )}
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
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center space-y-4 font-mono">
                <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-slate-500 text-sm">Your cart is currently empty.</p>
                <button onClick={() => setActiveView('marketplace')} className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-6 py-2 rounded-lg text-xs uppercase tracking-widest">Browse Marketplace</button>
              </div>
            ) : (
              <div className="bg-black border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="space-y-4 divide-y divide-slate-800">
                  {cart.map(item => (
                    <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4 font-mono">
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

                <div className="border-t border-slate-800 pt-6 flex justify-between items-center font-mono">
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-widest block">Total Escrow Value</span>
                    <span className="text-2xl font-bold text-amber-400">{cartTotalCULT} CULT</span>
                    <span className="text-xs text-slate-400 block">≈ ₹{cartTotalINR} INR</span>
                  </div>
                  <button onClick={() => { if (!user) setAuthModal('login'); else setActiveView('checkout_address'); }} className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    Proceed to Shipping <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipping View */}
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
                    <input required type="text" value={shippingForm.fullName} onChange={e => { setShippingForm({...shippingForm, fullName: e.target.value}); setShippingErrors({...shippingErrors, fullName: ''}); }} placeholder="Hostel Resident Name" className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none ${shippingErrors.fullName ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'}`} />
                    {shippingErrors.fullName && <span className="text-[10px] text-rose-400 block mt-1">{shippingErrors.fullName}</span>}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">10-Digit Phone Number *</label>
                    <input required type="tel" maxLength="10" value={shippingForm.phone} onChange={e => { setShippingForm({...shippingForm, phone: e.target.value.replace(/\D/g, '')}); setShippingErrors({...shippingErrors, phone: ''}); }} placeholder="9876543210" className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none ${shippingErrors.phone ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'}`} />
                    {shippingErrors.phone && <span className="text-[10px] text-rose-400 block mt-1">{shippingErrors.phone}</span>}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Hostel Block & Room Address *</label>
                  <input required type="text" value={shippingForm.address} onChange={e => { setShippingForm({...shippingForm, address: e.target.value}); setShippingErrors({...shippingErrors, address: ''}); }} placeholder="Room 302, Block B, Hostel Campus" className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none ${shippingErrors.address ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'}`} />
                  {shippingErrors.address && <span className="text-[10px] text-rose-400 block mt-1">{shippingErrors.address}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">City / Campus *</label>
                    <input required type="text" value={shippingForm.city} onChange={e => { setShippingForm({...shippingForm, city: e.target.value}); setShippingErrors({...shippingErrors, city: ''}); }} placeholder="Greater Noida" className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none ${shippingErrors.city ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'}`} />
                    {shippingErrors.city && <span className="text-[10px] text-rose-400 block mt-1">{shippingErrors.city}</span>}
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

              {checkoutError && (
                <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0"/> {checkoutError}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div onClick={() => { setPaymentMethod('cult_wallet'); setCheckoutError(''); }} className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${paymentMethod === 'cult_wallet' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                    <Coins className={`w-5 h-5 ${paymentMethod === 'cult_wallet' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">CULT Wallet</div>
                      <div className="text-[9px] text-amber-400">{cultBalance.toFixed(1)} CULT avail.</div>
                    </div>
                  </div>

                  <div onClick={() => { setPaymentMethod('qr_code'); setCheckoutError(''); }} className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${paymentMethod === 'qr_code' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                    <QrCode className={`w-5 h-5 ${paymentMethod === 'qr_code' ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">UPI / GPay</div>
                      <div className="text-[9px] text-slate-500">Prajjwal Maurya</div>
                    </div>
                  </div>

                  <div onClick={() => { setPaymentMethod('web3'); setCheckoutError(''); }} className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${paymentMethod === 'web3' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                    <Wallet className={`w-5 h-5 ${paymentMethod === 'web3' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">Web3 Lock</div>
                      <div className="text-[9px] text-slate-500">MetaMask ETH</div>
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === 'cult_wallet' && (
                <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-5 text-center space-y-2">
                  <Coins className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300">Deducting <strong className="text-amber-400 font-bold">{cartTotalCULT} CULT</strong> from your CULT Virtual Wallet.</p>
                  <p className="text-[10px] text-slate-500">Remaining Balance after order: <strong className="text-white">{(cultBalance - parseFloat(cartTotalCULT)).toFixed(2)} CULT</strong></p>
                </div>
              )}

              {paymentMethod === 'qr_code' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">Scan with Google Pay, PhonePe, or Paytm</span>
                    <strong className="text-white text-sm block">Prajjwal Maurya</strong>
                    <code className="text-cyan-400 text-xs block bg-black py-1 px-3 rounded inline-block border border-slate-800">prajjwal5655@okicici</code>
                  </div>

                  <div className="w-48 h-48 bg-white p-3 mx-auto rounded-xl shadow-2xl flex items-center justify-center border-2 border-cyan-500/50">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=prajjwal5655@okicici%26pn=Prajjwal%20Maurya%26am=${cartTotalINR}%26cu=INR`} 
                      alt="Prajjwal Maurya UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-slate-900 text-left space-y-2">
                    <label className="text-[10px] text-amber-400 uppercase tracking-widest block">Enter 12-Digit UPI Ref / UTR Number *</label>
                    <input 
                      required
                      type="text"
                      maxLength="12"
                      placeholder="e.g. 423987123901"
                      value={checkoutUtrInput}
                      onChange={e => { setCheckoutUtrInput(e.target.value.replace(/\D/g, '')); setCheckoutError(''); }}
                      className="w-full bg-black border border-amber-500/50 rounded-lg px-4 py-2.5 text-amber-300 text-sm tracking-widest focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-500 block">Must be 12 numeric digits from your UPI transaction receipt.</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'web3' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                  <Wallet className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-400">Smart Contract: <code className="text-emerald-400">0x71C...39A</code></p>
                  <p className="text-[11px] text-slate-500">Locking {cartTotalCULT} CULT value in decentralized escrow contract.</p>
                </div>
              )}

              <button onClick={processOrderPayment} className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 py-3.5 rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                <Lock className="w-4 h-4"/> Confirm Order & Lock Escrow
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
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <span>NEXUS<span className="text-emerald-400">RECEIPT</span></span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Official Escrow Transaction Record</p>
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
                  <span className="text-white">{lastReceipt.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase tracking-widest">Payment Rail</span>
                  <span className="text-amber-400">{lastReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Itemized Purchase Summary</span>
                <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
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

              <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-widest block">Total Paid</span>
                  <span className="text-2xl font-bold text-amber-400">{lastReceipt.totalCULT} CULT</span>
                  <span className="text-xs text-slate-400 block">≈ ₹{lastReceipt.totalINR} INR</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest flex items-center gap-2">
                    <Printer className="w-4 h-4"/> Print / PDF
                  </button>
                  <button onClick={() => setActiveView('marketplace')} className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold">
                    Marketplace
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Orders */}
        {activeView === 'my_orders' && (
          <div className="max-w-4xl mx-auto space-y-6 font-mono">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
              <Package className="text-cyan-400" /> Order History & Receipts
            </h2>

            {db.orders.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
                No past orders found in SQLite database for @{user?.username}.
              </div>
            ) : (
              <div className="space-y-4">
                {db.orders.map(order => (
                  <div key={order.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-cyan-400 font-bold text-sm">{order.id}</span>
                        <span className="text-[10px] text-slate-500 block">{order.timestamp}</span>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900">{order.status}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                          <span>{it.title} (x{it.qty})</span>
                          <span className="text-amber-400 font-bold">{it.price} CULT</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs">
                      <div>
                        <span className="text-slate-500">Shipping: </span>
                        <span className="text-white">{order.shipping?.fullName} ({order.shipping?.phone}) - {order.shipping?.address}, {order.shipping?.city}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 font-bold text-sm block">{order.total} CULT</span>
                        <span className="text-[10px] text-slate-500">Rail: {order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRO Membership */}
        {activeView === 'pro_upgrade' && (
          <div className="max-w-xl mx-auto space-y-6 font-mono text-center">
            <div className="bg-black border border-amber-500/40 rounded-xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"></div>
              
              <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">PRO Node Membership</h2>
                <p className="text-xs text-slate-400 mt-1">Upgrade your identity for high-trust trading and exclusive badges.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-left space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300"><CheckCircle2 className="w-4 h-4 text-amber-400"/> Gold PRO badge displayed across chats and listings.</div>
                <div className="flex items-center gap-2 text-slate-300"><CheckCircle2 className="w-4 h-4 text-amber-400"/> Priority ranking in search and marketplace suggestions.</div>
                <div className="flex items-center gap-2 text-slate-300"><CheckCircle2 className="w-4 h-4 text-amber-400"/> Unlimited group chat channel creation & media uploads.</div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="text-xs text-slate-400">Upgrade Cost: <strong className="text-amber-400 font-bold">25.00 CULT</strong> (or ₹2,500 INR via UPI)</div>

                {isPro ? (
                  <div className="bg-amber-950/40 border border-amber-800 text-amber-400 p-3 rounded-lg text-xs font-bold uppercase tracking-widest">
                    Your Node is Currently Upgraded to PRO Status
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button onClick={handleUpgradeProCULT} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all">
                      Upgrade Node via CULT Wallet (25 CULT)
                    </button>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-3">
                      <div className="text-xs font-bold text-cyan-400 uppercase">Or Pay ₹2,500 via UPI QR Code</div>
                      
                      <div className="w-32 h-32 bg-white p-2 mx-auto rounded-lg">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=prajjwal5655@okicici%26pn=Prajjwal%20Maurya%26am=2500%26cu=INR" alt="UPI QR Code" className="w-full h-full object-contain" />
                      </div>

                      {proUtrError && (
                        <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-2 rounded text-[11px] font-mono">
                          {proUtrError}
                        </div>
                      )}

                      <form onSubmit={handleUpgradeProUTR} className="space-y-2">
                        <input 
                          required
                          type="text"
                          maxLength="12"
                          placeholder="Enter 12-digit UPI UTR Number..."
                          value={proUtrInput}
                          onChange={e => { setProUtrInput(e.target.value.replace(/\D/g, '')); setProUtrError(''); }}
                          className="w-full bg-black border border-amber-500/50 rounded px-3 py-2 text-xs text-amber-300 focus:outline-none tracking-widest font-mono"
                        />
                        <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 py-2.5 rounded text-xs uppercase font-bold tracking-widest">
                          Verify UTR & Upgrade PRO
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'global_chat' && renderChatInterface('global')}
        {activeView === 'private_chat' && renderChatInterface('private')}
        {activeView === 'group_chat' && renderChatInterface('group')}

        {/* Vendor Console */}
        {activeView === 'dashboard' && user?.role === 'seller' && (
          <div className="space-y-8 font-mono">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-emerald-500" /> Vendor Console
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-black border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 to-emerald-500"></div>
                  <h3 className="text-sm font-bold text-emerald-500 mb-6 uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Deploy Listing</h3>
                  
                  <form onSubmit={handleDeployListing} className="space-y-4">
                    <input required type="text" value={newProduct.title} onChange={e=>setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm" placeholder="Title..." />
                    <input required type="number" step="1" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm" placeholder="Price (CULT)..." />
                    
                    <select value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm">
                      <option value="Hardware">Hardware</option>
                      <option value="Privacy & VPN">Privacy & VPN</option>
                      <option value="Security Tools">Security Tools</option>
                      <option value="Premium Services">Premium Services</option>
                    </select>

                    <textarea required value={newProduct.desc} onChange={e=>setNewProduct({...newProduct, desc: e.target.value})} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none text-sm resize-none" placeholder="Description..."></textarea>
                    <button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-bold py-3 rounded-lg text-xs tracking-widest uppercase">Publish Product</button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                  {items.filter(item => item.seller === user.username).map(item => (
                    <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-amber-400 mt-1">{item.price} CULT (≈ ₹{parseFloat(item.price) * 100}) | {item.category}</p>
                      </div>
                      <span className="text-[10px] text-emerald-500 bg-emerald-950/30 px-3 py-1 rounded border border-emerald-900 uppercase tracking-widest">Active</span>
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