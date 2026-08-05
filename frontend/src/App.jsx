import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, ShieldCheck, Lock, Mail, User, Eye, EyeOff, 
  ShoppingCart, Tag, PlusCircle, Globe, Wallet, CheckCircle, CheckCircle2,
  AlertTriangle, MessageSquare, Send, X, UserPlus, UserCheck, Terminal,
  MapPin, Phone, CreditCard, QrCode, ArrowRight, Trash2, ChevronLeft, Package,
  Wifi, WifiOff, Key, RefreshCw
} from 'lucide-react';

const SECRET_PASSPHRASE = "HOSTEL_NEXUS_SECURE_KEY_2026";

const encryptText = (plainText) => {
  try {
    const textChars = plainText.split('');
    const keyChars = SECRET_PASSPHRASE.split('');
    const cipherChars = textChars.map((char, index) => {
      const charCode = char.charCodeAt(0);
      const keyCode = keyChars[index % keyChars.length].charCodeAt(0);
      return String.fromCharCode(charCode ^ keyCode);
    });
    return btoa(unescape(encodeURIComponent(cipherChars.join(''))));
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
};

const decryptText = (cipherText) => {
  try {
    const decoded = decodeURIComponent(escape(atob(cipherText)));
    const cipherChars = decoded.split('');
    const keyChars = SECRET_PASSPHRASE.split('');
    const plainChars = cipherChars.map((char, index) => {
      const charCode = char.charCodeAt(0);
      const keyCode = keyChars[index % keyChars.length].charCodeAt(0);
      return String.fromCharCode(charCode ^ keyCode);
    });
    return plainChars.join('');
  } catch (err) {
    return cipherText;
  }
};

export default function App() {
  const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  const apiBaseUrl = `http://${host}:8000`;
  const wsBaseUrl = `ws://${host}:8000`;

  const [db, setDb] = useState({
    users: [],
    globalMessages: [
      { id: 1, sender: 'System', text: encryptText('Welcome to the Encrypted Hostel Relay. All messages are encrypted end-to-end.'), timestamp: new Date().toISOString(), isSystem: true }
    ],
    privateMessages: {},
    orders: []
  });

  const [activeView, setActiveView] = useState('marketplace'); 
  const [authModal, setAuthModal] = useState(null); 
  const [userProfileModal, setUserProfileModal] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
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
  const [paymentMethod, setPaymentMethod] = useState('qr_code');
  const [lastOrder, setLastOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '', confirmPassword: '', role: 'buyer' });
  const [authError, setAuthError] = useState('');
  const [chatInput, setChatInput] = useState('');

  const globalWsRef = useRef(null);
  const privateWsRef = useRef(null);
  const chatScrollRef = useRef(null);

  const [items, setItems] = useState([
    { id: 1, title: "Zero-Log Encrypted Router", price: "0.5", currency: "ETH", seller: "SecureTech", state: "Available", desc: "Military-grade hardware firewall router with zero tracking." },
    { id: 2, title: "Anonymous VPN Server Config", price: "0.1", currency: "ETH", seller: "NetNinja", state: "Available", desc: "Self-hosted VPN configuration scripts with automated kill-switch." },
    { id: 3, title: "Hardware Crypto Cold Wallet", price: "0.25", currency: "ETH", seller: "CryptoVault", state: "Available", desc: "Tamper-proof hardware wallet for offline private key storage." }
  ]);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', desc: '' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchMarketItems = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/items`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch items from backend, using local state:", err);
    }
  };

  useEffect(() => {
    fetchMarketItems();
    const interval = setInterval(fetchMarketItems, 4000);
    return () => clearInterval(interval);
  }, [host]);

  useEffect(() => {
    if (!user) return;

    const connectGlobalWS = () => {
      try {
        const ws = new WebSocket(`${wsBaseUrl}/ws/chat/global`);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setDb(prev => {
              if (prev.globalMessages.some(m => m.id === data.id && m.timestamp === data.timestamp)) {
                return prev;
              }
              return {
                ...prev,
                globalMessages: [...prev.globalMessages, data]
              };
            });
          } catch (e) {
            console.error("Failed to parse incoming WebSocket message:", e);
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
        console.warn("Global WebSocket connection error:", err);
      }
    };

    connectGlobalWS();

    return () => {
      if (globalWsRef.current) {
        globalWsRef.current.close();
      }
    };
  }, [user, host]);

  const getPrivateChatKey = (user1, user2) => {
    return [user1, user2].sort().join('_');
  };

  useEffect(() => {
    if (!user || !activePrivateChat || activeView !== 'private_chat') return;

    const chatRoomId = getPrivateChatKey(user.username, activePrivateChat);
    const connectPrivateWS = () => {
      try {
        const ws = new WebSocket(`${wsBaseUrl}/ws/chat/private/${chatRoomId}`);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setDb(prev => {
              const existingRoomMsgs = prev.privateMessages[chatRoomId] || [];
              if (existingRoomMsgs.some(m => m.id === data.id && m.timestamp === data.timestamp)) {
                return prev;
              }
              return {
                ...prev,
                privateMessages: {
                  ...prev.privateMessages,
                  [chatRoomId]: [...existingRoomMsgs, data]
                }
              };
            });
          } catch (e) {
            console.error("Failed to parse private WebSocket message:", e);
          }
        };

        privateWsRef.current = ws;
      } catch (err) {
        console.warn("Private WebSocket connection error:", err);
      }
    };

    connectPrivateWS();

    return () => {
      if (privateWsRef.current) {
        privateWsRef.current.close();
      }
    };
  }, [user, activePrivateChat, activeView, host]);

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

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0).toFixed(2);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.address || !shippingForm.city) {
      showToast("Please fill in all required shipping details.");
      return;
    }
    setActiveView('checkout_payment');
  };

  const processOrderPayment = () => {
    const newOrder = {
      id: 'NEX-' + Math.floor(100000 + Math.random() * 900000),
      items: [...cart],
      total: cartTotal,
      shipping: { ...shippingForm },
      paymentMethod: paymentMethod,
      timestamp: new Date().toLocaleString(),
      status: 'Escrow Locked / Processing'
    };

    setDb(prev => ({ ...prev, orders: [newOrder, ...prev.orders] }));
    setLastOrder(newOrder);
    setCart([]);
    setActiveView('order_confirmed');
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
    setAuthError('');
  };

  const submitRegister = (e) => {
    e.preventDefault();
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError("Passwords do not match!");
      return;
    }
    if (authForm.password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    if (db.users.find(u => u.username === authForm.username)) {
      setAuthError("Username already exists in the registry.");
      return;
    }
    setAuthModal('verify');
  };

  const submitVerify = () => {
    const newUser = { 
      email: authForm.email, 
      username: authForm.username, 
      password: authForm.password, 
      role: authForm.role, 
      following: [],
      isVerified: true 
    };
    
    setDb(prev => ({ ...prev, users: [...prev.users, newUser] }));
    setUser(newUser);
    setAuthModal(null);
    setActiveView(newUser.role === 'seller' ? 'dashboard' : 'marketplace');
  };

  const submitLogin = (e) => {
    e.preventDefault();
    const existingUser = db.users.find(u => u.username === authForm.username);
    
    if (!existingUser) {
      const autoUser = {
        email: `${authForm.username}@hostel.net`,
        username: authForm.username,
        password: authForm.password,
        role: 'buyer',
        following: [],
        isVerified: true
      };
      setDb(prev => ({ ...prev, users: [...prev.users, autoUser] }));
      setUser(autoUser);
      setAuthModal(null);
      showToast(`Node registered & authenticated: @${authForm.username}`);
      return;
    }

    if (existingUser.password !== authForm.password) {
      setAuthError("Incorrect password. Access denied.");
      return;
    }

    setUser(existingUser);
    setAuthModal(null);
  };

  const logout = () => {
    setUser(null);
    setActiveView('marketplace');
  };

  const sendGlobalMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    
    const encryptedText = encryptText(chatInput);
    const newMsg = {
      id: Date.now(),
      sender: user.username,
      text: encryptedText,
      timestamp: new Date().toISOString()
    };
    
    if (globalWsRef.current && globalWsRef.current.readyState === WebSocket.OPEN) {
      globalWsRef.current.send(JSON.stringify(newMsg));
    } else {
      setDb(prev => ({ ...prev, globalMessages: [...prev.globalMessages, newMsg] }));
    }

    setChatInput('');
  };

  const sendPrivateMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !activePrivateChat) return;

    const chatKey = getPrivateChatKey(user.username, activePrivateChat);
    const encryptedText = encryptText(chatInput);
    const newMsg = {
      id: Date.now(),
      sender: user.username,
      text: encryptedText,
      timestamp: new Date().toISOString()
    };

    if (privateWsRef.current && privateWsRef.current.readyState === WebSocket.OPEN) {
      privateWsRef.current.send(JSON.stringify(newMsg));
    }

    setDb(prev => {
      const existingHistory = prev.privateMessages[chatKey] || [];
      return {
        ...prev,
        privateMessages: {
          ...prev.privateMessages,
          [chatKey]: [...existingHistory, newMsg]
        }
      };
    });
    setChatInput('');
  };

  const handleDeployListing = async (e) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price || !user) return;

    const itemPayload = {
      id: Date.now(),
      title: newProduct.title,
      price: newProduct.price.toString(),
      currency: 'ETH',
      seller: user.username,
      state: 'Available',
      desc: newProduct.desc || 'No description provided.'
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemPayload)
      });
      if (res.ok) {
        const savedItem = await res.json();
        setItems(prev => [savedItem, ...prev]);
      } else {
        setItems(prev => [itemPayload, ...prev]);
      }
    } catch (err) {
      setItems(prev => [itemPayload, ...prev]);
    }

    setNewProduct({ title: '', price: '', desc: '' });
    showToast("New item listed on hostel marketplace!");
  };

  const toggleFollowUser = (targetUsername) => {
    setDb(prev => {
      const updatedUsers = prev.users.map(u => {
        if (u.username === user.username) {
          const isFollowing = u.following.includes(targetUsername);
          return {
            ...u,
            following: isFollowing ? u.following.filter(f => f !== targetUsername) : [...u.following, targetUsername]
          };
        }
        return u;
      });
      return { ...prev, users: updatedUsers };
    });
    
    setUser(prev => {
      const isFollowing = prev.following.includes(targetUsername);
      return {
        ...prev,
        following: isFollowing ? prev.following.filter(f => f !== targetUsername) : [...prev.following, targetUsername]
      };
    });
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
        <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-cyan-500 to-slate-800"></div>

          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Lock className="text-cyan-400 w-5 h-5" />
              <h2 className="text-lg font-mono font-bold text-white tracking-widest uppercase">
                {authModal === 'login' ? 'System Login' : authModal === 'register' ? 'Node Registration' : 'Verify Identity'}
              </h2>
            </div>
            <button onClick={() => setAuthModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>

          {authModal === 'verify' && (
            <div className="p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30">
                <Mail className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Check Encrypted Inbox</h3>
                <p className="text-slate-400 text-sm">We sent a verification packet to <strong className="text-cyan-400">{authForm.email}</strong>. Enter the key to proceed.</p>
              </div>
              <input type="text" placeholder="0x..." className="w-full bg-black border border-slate-800 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-cyan-400 focus:border-cyan-500 focus:outline-none font-mono placeholder:text-slate-700" />
              <button onClick={submitVerify} className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-mono font-bold py-3 rounded-lg transition-all uppercase tracking-widest">
                Decrypt & Enter
              </button>
            </div>
          )}

          {(authModal === 'login' || authModal === 'register') && (
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
                {authModal === 'login' ? 'Authenticate' : 'Initialize Node'}
              </button>

              <div className="text-center pt-3 border-t border-slate-800 mt-4">
                {authModal === 'login' ? (
                  <button type="button" onClick={() => setAuthModal('register')} className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">Establish New Identity?</button>
                ) : (
                  <button type="button" onClick={() => setAuthModal('login')} className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">Existing Identity Login</button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  const renderUserProfileModal = () => {
    if (!userProfileModal) return null;
    const targetUser = db.users.find(u => u.username === userProfileModal) || { username: userProfileModal, role: 'Vendor/User', isVerified: true };
    const isMe = user?.username === targetUser.username;
    const amFollowing = user?.following?.includes(targetUser.username);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={(e) => { if(e.target === e.currentTarget) setUserProfileModal(null); }}>
        <div className="bg-black border border-slate-700 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
          <div className="p-6 text-center border-b border-slate-800 relative">
            <button onClick={() => setUserProfileModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-800 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Terminal className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-xl font-mono font-bold text-white flex items-center justify-center gap-2">
              {targetUser.username} {targetUser.isVerified && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </h2>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">Role: {targetUser.role}</p>
          </div>
          
          <div className="p-4 bg-slate-900/50 space-y-3">
            {!isMe && user && (
              <>
                <button onClick={() => openPrivateChat(targetUser.username)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-mono py-3 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Start Encrypted Chat
                </button>
                <button onClick={() => toggleFollowUser(targetUser.username)} className={`w-full font-mono py-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${amFollowing ? 'bg-cyan-950/50 text-cyan-400 border-cyan-800' : 'bg-black text-slate-300 border-slate-700 hover:border-slate-500'}`}>
                  {amFollowing ? <><UserCheck className="w-4 h-4" /> Following Entity</> : <><UserPlus className="w-4 h-4" /> Monitor / Follow</>}
                </button>
              </>
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
    const chatKey = getPrivateChatKey(user?.username, activePrivateChat);
    const messages = isGlobal ? db.globalMessages : (db.privateMessages[chatKey] || []);
    const chatTitle = isGlobal ? 'Hostel P2P Global Relay' : `Encrypted Channel: ${activePrivateChat}`;
    
    return (
      <div className="max-w-4xl mx-auto bg-black border border-slate-800 rounded-xl flex flex-col h-[75vh] shadow-2xl relative overflow-hidden">
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {isGlobal ? <Globe className="w-5 h-5 text-cyan-500" /> : <Lock className="w-5 h-5 text-emerald-500" />}
            <div>
              <h3 className="text-white font-mono font-bold tracking-wide">{chatTitle}</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1">
                {isGlobal ? (
                  <>
                    {wsConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-500" />}
                    {wsConnected ? 'Hostel Mesh Connected' : 'Local Standalone Relay'}
                  </>
                ) : (
                  <><Key className="w-3 h-3 text-emerald-400" /> Client-Side Encrypted (E2EE)</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black relative">
          {messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-mono text-xs uppercase tracking-widest">
              No transmission history.
            </div>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user?.username;
            const decryptedContent = decryptText(msg.text);

            return (
              <div key={idx} className={`flex flex-col ${msg.isSystem ? 'items-center' : isMe ? 'items-end' : 'items-start'}`}>
                {msg.isSystem ? (
                  <div className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                    {decryptedContent}
                  </div>
                ) : (
                  <div className="max-w-[75%]">
                    {!isMe && (
                      <span onClick={() => setUserProfileModal(msg.sender)} className="text-[10px] font-mono text-cyan-600 mb-1 block cursor-pointer hover:text-cyan-400 ml-1">
                        @{msg.sender}
                      </span>
                    )}
                    <div className={`p-3 rounded-2xl text-sm font-mono leading-relaxed ${isMe ? 'bg-cyan-950 text-cyan-50 rounded-tr-sm border border-cyan-900' : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'}`}>
                      {decryptedContent}
                    </div>
                    <span className={`text-[9px] font-mono text-slate-600 mt-1 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 z-10">
          <form onSubmit={isGlobal ? sendGlobalMessage : sendPrivateMessage} className="flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Inject encrypted message..." className="flex-1 bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm placeholder:text-slate-700" />
            <button type="submit" disabled={!chatInput.trim()} className="bg-cyan-950 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 border border-cyan-800 p-3 rounded-lg transition-colors flex items-center justify-center">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-900 relative pb-12">
      {renderAuthModal()}
      {renderUserProfileModal()}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {toastMessage}
        </div>
      )}

      <nav className="border-b border-slate-800 bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-xl tracking-widest cursor-pointer" onClick={() => setActiveView('marketplace')}>
                <Shield className="w-6 h-6 text-cyan-500" />
                <span>NEXUS<span className="text-cyan-500 opacity-70">MARKET</span></span>
            </div>
            
            <div className="hidden md:flex gap-6 font-mono text-sm uppercase tracking-wider">
                <button onClick={() => setActiveView('marketplace')} className={`h-16 px-2 flex items-center transition-colors ${activeView === 'marketplace' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>Market</button>
                <button onClick={() => user ? setActiveView('global_chat') : setAuthModal('login')} className={`h-16 px-2 flex items-center gap-2 transition-colors ${activeView === 'global_chat' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                  <Globe className="w-4 h-4"/> Global Chat
                </button>
                {user && (
                  <button onClick={() => setActiveView('orders_history')} className={`h-16 px-2 flex items-center gap-2 transition-colors ${activeView === 'orders_history' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                    <Package className="w-4 h-4"/> My Orders
                  </button>
                )}
                {user?.role === 'seller' && (
                  <button onClick={() => setActiveView('dashboard')} className={`h-16 px-2 flex items-center gap-2 transition-colors ${activeView === 'dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}>
                    <Terminal className="w-4 h-4"/> Vendor Console
                  </button>
                )}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setActiveView('cart')} className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-black font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block cursor-pointer group" onClick={() => setUserProfileModal(user.username)}>
                    <div className="font-mono font-bold text-white flex items-center gap-1 justify-end group-hover:text-cyan-400 transition-colors">
                      {user.username} {user.isVerified && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                    </div>
                    <div className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">{user.role}</div>
                  </div>
                  <button onClick={logout} className="text-[10px] uppercase tracking-widest font-mono text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-900 px-2 py-1 rounded">Disconnect</button>
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

      {}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* VIEW 1: MARKETPLACE */}
        {activeView === 'marketplace' && (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800 pb-4 gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight font-mono uppercase">Secure Marketplace</h2>
                      <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-widest">Encrypted commerce with decentralized escrow.</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 bg-emerald-950/20 px-3 py-1.5 rounded border border-emerald-900/50 uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3" /> Escrow Contracts Active
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
                                  <button onClick={() => setUserProfileModal(item.seller)} className="text-cyan-500 hover:text-cyan-300 transition-colors mt-1">
                                    @{item.seller}
                                  </button>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Cost</span><br/>
                                  <span className="text-lg font-bold text-white font-mono">{item.price} <span className="text-xs text-emerald-500">{item.currency}</span></span>
                                </div>
                            </div>
                            
                            <div className="mt-auto pl-3 flex gap-2">
                                <button 
                                    onClick={() => addToCart(item)}
                                    className="flex-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4"/> Add to Cart
                                </button>
                                <button 
                                    onClick={() => {
                                      addToCart(item);
                                      setActiveView('cart');
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 py-3 px-4 rounded-lg font-mono text-xs uppercase tracking-widest transition-all"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* VIEW 2: CART */}
        {activeView === 'cart' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-cyan-500" /> Shopping Cart
              </h2>
              <button onClick={() => setActiveView('marketplace')} className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Continue Shopping
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center space-y-4">
                <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="font-mono text-slate-500 text-sm">Your encrypted cart is empty.</p>
                <button onClick={() => setActiveView('marketplace')} className="bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-mono text-xs px-6 py-3 rounded-lg uppercase tracking-widest transition-all">
                  Browse Items
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-4 flex items-center justify-between font-mono">
                      <div className="space-y-1">
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-500">Vendor: @{item.seller}</p>
                        <p className="text-sm font-bold text-cyan-400">{item.price} ETH</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-slate-800 rounded-lg bg-slate-950">
                          <button onClick={() => updateCartQty(item.id, -1)} className="px-3 py-1 text-slate-400 hover:text-white">-</button>
                          <span className="px-3 py-1 text-xs text-white font-bold">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="px-3 py-1 text-slate-400 hover:text-white">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-400 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-black border border-slate-800 rounded-xl p-6 font-mono space-y-6 h-fit">
                  <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>{cartTotal} ETH</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Estimated Escrow Gas Fee</span>
                      <span>0.002 ETH</span>
                    </div>
                    <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-white text-base">
                      <span>Total</span>
                      <span className="text-emerald-400">{(parseFloat(cartTotal) + 0.002).toFixed(3)} ETH</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!user) {
                        setAuthModal('login');
                      } else {
                        setActiveView('checkout_address');
                      }
                    }} 
                    className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-mono font-bold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Proceed to Shipping <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CHECKOUT - ADDRESS & PHONE */}
        {activeView === 'checkout_address' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest flex items-center gap-3">
                <MapPin className="w-6 h-6 text-cyan-500" /> Shipping & Contact Details
              </h2>
              <button onClick={() => setActiveView('cart')} className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back to Cart
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="bg-black border border-slate-800 rounded-xl p-6 font-mono space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Recipient Name / Alias *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-600" />
                  <input 
                    required 
                    type="text" 
                    value={shippingForm.fullName}
                    onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" 
                    placeholder="John Doe / Node-402"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Phone Number (Encrypted SMS Updates) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-600" />
                  <input 
                    required 
                    type="tel" 
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" 
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Drop Address / Hostel Room No. *</label>
                <input 
                  required 
                  type="text" 
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" 
                  placeholder="Block B, Room 304, Tech Campus Hostel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block">City / Sector *</label>
                  <input 
                    required 
                    type="text" 
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" 
                    placeholder="Greater Noida"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Postal Code</label>
                  <input 
                    type="text" 
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none text-sm" 
                    placeholder="201310"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 font-mono font-bold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-6">
                Proceed to Payment <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: CHECKOUT - PAYMENT PAGE */}
        {activeView === 'checkout_payment' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-emerald-500" /> Payment & Escrow Lock
              </h2>
              <button onClick={() => setActiveView('checkout_address')} className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back to Shipping
              </button>
            </div>

            <div className="bg-black border border-slate-800 rounded-xl p-6 font-mono space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Select Payment Gate</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('qr_code')}
                    className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'qr_code' ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    <QrCode className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase">QR Code / UPI Scan</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'crypto' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase">Web3 Web Wallet</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'qr_code' && (
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-center space-y-4">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Scan QR Code with any Payment App to Lock Funds in Escrow</p>
                  
                  <div className="w-48 h-48 bg-white p-3 mx-auto rounded-xl shadow-lg flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F?amount=${cartTotal}`} 
                      alt="Payment QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total Amount to Pay</span>
                    <p className="text-xl font-bold text-cyan-400">{cartTotal} ETH (~ ${(parseFloat(cartTotal) * 3200).toFixed(2)} USD)</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'crypto' && (
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-4 text-center">
                  <Wallet className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Direct Web3 Escrow Contract</h4>
                    <p className="text-xs text-slate-500 mt-1">Smart Contract Address: 0x71C...976F</p>
                  </div>
                  <button 
                    onClick={() => setWalletAddress('0x' + Math.random().toString(16).substr(2, 40))} 
                    className="bg-slate-900 border border-slate-700 text-xs text-emerald-400 px-4 py-2 rounded-lg font-mono"
                  >
                    {walletAddress ? `Connected: ${walletAddress.substr(0,6)}...${walletAddress.substr(-4)}` : "Connect Wallet"}
                  </button>
                </div>
              )}

              <div className="border-t border-slate-800 pt-4 text-xs space-y-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Shipping To:</span>
                  <span className="text-white">{shippingForm.fullName} ({shippingForm.phone})</span>
                </div>
                <div className="flex justify-between">
                  <span>Address:</span>
                  <span className="text-white">{shippingForm.address}, {shippingForm.city}</span>
                </div>
              </div>

              <button 
                onClick={processOrderPayment}
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-mono font-bold py-4 rounded-lg text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" /> Confirm Payment & Lock Escrow
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: ORDER CONFIRMED */}
        {activeView === 'order_confirmed' && lastOrder && (
          <div className="max-w-xl mx-auto bg-black border border-slate-800 rounded-xl p-8 text-center font-mono space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"></div>

            <div className="w-16 h-16 bg-emerald-950/50 rounded-full border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Order Confirmed!</h2>
              <p className="text-xs text-slate-500 mt-1">Escrow payment locked in smart contract.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Order ID:</span>
                <span className="text-cyan-400 font-bold">{lastOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Recipient:</span>
                <span className="text-white">{lastOrder.shipping.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Phone:</span>
                <span className="text-white">{lastOrder.shipping.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Destination:</span>
                <span className="text-white">{lastOrder.shipping.address}, {lastOrder.shipping.city}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Total Locked Amount:</span>
                <span className="text-emerald-400 font-bold">{lastOrder.total} ETH</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setActiveView('marketplace')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 py-3 rounded-lg text-xs uppercase tracking-widest border border-slate-700">
                Shop More
              </button>
              <button onClick={() => setActiveView('orders_history')} className="flex-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 py-3 rounded-lg text-xs uppercase tracking-widest">
                View My Orders
              </button>
            </div>
          </div>
        )}

        {/* VIEW 6: MY ORDERS HISTORY */}
        {activeView === 'orders_history' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest flex items-center gap-3">
                <Package className="w-6 h-6 text-cyan-500" /> Order History
              </h2>
            </div>

            {db.orders.length === 0 ? (
              <div className="bg-black border border-slate-800 rounded-xl p-12 text-center font-mono text-slate-500">
                No orders placed yet.
              </div>
            ) : (
              <div className="space-y-4 font-mono">
                {db.orders.map(order => (
                  <div key={order.id} className="bg-black border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs text-slate-500">Order ID</span>
                        <h4 className="text-base font-bold text-cyan-400">{order.id}</h4>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-1">Purchased Items:</span>
                        {order.items.map((i, idx) => (
                          <div key={idx} className="text-white">{i.qty}x {i.title} ({i.price} ETH)</div>
                        ))}
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Deliver To:</span>
                        <div className="text-white">{order.shipping.fullName}</div>
                        <div className="text-slate-400">{order.shipping.phone}</div>
                        <div className="text-slate-400">{order.shipping.address}, {order.shipping.city}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Global Chat */}
        {activeView === 'global_chat' && renderChatInterface('global')}

        {/* VIEW: Private Chat */}
        {activeView === 'private_chat' && renderChatInterface('private')}

        {/* VIEW: Seller Dashboard Terminal */}
        {activeView === 'dashboard' && user?.role === 'seller' && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-widest flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-emerald-500" /> Vendor Terminal
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-black border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 to-emerald-500"></div>
                  <h3 className="text-sm font-mono font-bold text-emerald-500 mb-6 uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-4 h-4"/> New Listing</h3>
                  
                  <form onSubmit={handleDeployListing} className="space-y-4">
                    <input required type="text" value={newProduct.title} onChange={e=>setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm" placeholder="Title..." />
                    <input required type="number" step="0.01" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm" placeholder="Price (ETH)..." />
                    <textarea required value={newProduct.desc} onChange={e=>setNewProduct({...newProduct, desc: e.target.value})} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm resize-none" placeholder="Description..."></textarea>
                    <button type="submit" className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-mono font-bold py-3 rounded-lg text-xs tracking-widest uppercase">Deploy Contract</button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                  {items.filter(item => item.seller === user.username).map(item => (
                    <div key={item.id} className="bg-black border border-slate-800 rounded-xl p-4 flex items-center justify-between font-mono">
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-emerald-500 mt-1">{item.price} {item.currency}</p>
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