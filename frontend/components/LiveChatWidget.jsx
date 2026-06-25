"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import './LiveChatWidget.css';

// ── Custom Voice Player ───────────────────────────────────────────────────────
function VoicePlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { audio.play(); }
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current?.currentTime || 0);
  const handleLoadedMetadata = () => setDuration(audioRef.current?.duration || 0);
  const handleEnded = () => { setPlaying(false); setCurrentTime(0); };
  const handlePlay = () => setPlaying(true);
  const handlePause = () => setPlaying(false);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const fmt = (s) => {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="voice-player">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="metadata"
      />
      <button className="voice-play-btn" onClick={togglePlay} aria-label={playing ? 'توقف' : 'پخش'}>
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        )}
      </button>
      <div className="voice-track" onClick={handleSeek}>
        <div className="voice-track-fill" style={{ width: `${progress}%` }} />
        <div className="voice-track-thumb" style={{ left: `${progress}%` }} />
      </div>
      <span className="voice-time">{fmt(currentTime)}</span>
    </div>
  );
}

// ── Media bubble renderer ─────────────────────────────────────────────────────
function MediaBubble({ msg, apiBase }) {
  const src = msg.file_url
    ? (msg.file_url.startsWith('http') ? msg.file_url : `${apiBase}${msg.file_url}`)
    : null;

  if (msg.message_type === 'image') {
    return (
      <div className="chat-media-img-wrap">
        <img
          src={src}
          alt="تصویر"
          className="chat-media-img"
          onClick={() => window.open(src, '_blank')}
        />
        {msg.text && <div className="chat-media-caption">{msg.text}</div>}
      </div>
    );
  }
  if (msg.message_type === 'video') {
    return (
      <div className="chat-media-video-wrap">
        <video src={src} controls className="chat-media-video" />
        {msg.text && <div className="chat-media-caption">{msg.text}</div>}
      </div>
    );
  }
  if (msg.message_type === 'audio') {
    return (
      <div className="chat-media-audio-wrap">
        <VoicePlayer src={src} />
        {msg.text && <div className="chat-media-caption">{msg.text}</div>}
      </div>
    );
  }
  return <span>{msg.text}</span>;
}

// ── Date divider formatter ───────────────────────────────────────────────────
const formatDividerDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return "امروز";
  } else if (isYesterday) {
    return "دیروز";
  } else {
    return date.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
};

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function LiveChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showGreeting, setShowGreeting] = useState(false);
  // Media state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [botMessages, setBotMessages] = useState([]);
  const [expectingTrackingCode, setExpectingTrackingCode] = useState(false);

  const allMessages = [...messages, ...botMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const [voiceCooldown, setVoiceCooldown] = useState(0); // seconds remaining in cooldown
  const [voiceToast, setVoiceToast] = useState('');    // short feedback message

  const MIN_VOICE_SECONDS = 1;   // discard recordings shorter than this
  const VOICE_COOLDOWN_SEC = 4;  // seconds to block mic after each send
  const voiceCooldownRef = useRef(null);
  const recordSecondsRef = useRef(0);  // shadow of recordSeconds accessible inside closure
  const [waveformData, setWaveformData] = useState(Array(8).fill(0));
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // ── Ding sound ──────────────────────────────────────────────────────────────
  const playDingSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.04, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.start(); osc1.stop(ctx.currentTime + 0.5);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08 + 0.7);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.08 + 0.7);
    } catch (err) {}
  };

  // ── Greeting bubble ─────────────────────────────────────────────────────────
  useEffect(() => {
    const dismissed = localStorage.getItem("liveChatGreetingDismissed");
    if (dismissed === "true") return;
    const timer = setTimeout(() => {
      if (!isOpen && messages.length === 0) { setShowGreeting(true); playDingSound(); }
    }, 4000);
    return () => clearTimeout(timer);
  }, [isOpen, messages]);

  // ── Auto scroll ─────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) { scrollToBottom(); setUnreadCount(0); }
  }, [messages, isOpen, scrollToBottom]);

  // ── Session init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("liveChatSessionId");
    if (stored) setSessionId(stored);
  }, []);

  const initChat = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', session_id: sessionId || null }),
      });
      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem("liveChatSessionId", data.session_id);
      }
    } catch (err) { console.error("Failed to init chat", err); }
  };

  // ── Poll messages ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !apiBase) return;
    let intervalId;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${apiBase}/api/chat?session_id=${sessionId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(prev => {
            if (data.messages.length > prev.length && !isOpen) {
              const newMsgs = data.messages.slice(prev.length);
              const adminNew = newMsgs.filter(m => m.sender === 'admin').length;
              if (adminNew > 0) { setUnreadCount(c => c + adminNew); playDingSound(); }
            }
            return data.messages;
          });
        }
      } catch (err) {}
    };
    fetchMessages();
    intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [sessionId, apiBase, isOpen]);

  // ── Toggle chat ─────────────────────────────────────────────────────────────
  const toggleChat = () => {
    if (!isOpen && !sessionId) initChat();
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setUnreadCount(0); setShowGreeting(false);
      localStorage.setItem("liveChatGreetingDismissed", "true");
    }
  };

  const handleDismissGreeting = (e) => {
    e.stopPropagation();
    setShowGreeting(false);
    localStorage.setItem("liveChatGreetingDismissed", "true");
  };

  // ── Upload helper ───────────────────────────────────────────────────────────
  const uploadFile = async (file, currentSessionId) => {
    const sid = currentSessionId || sessionId;
    if (!sid || !apiBase) return null;
    const form = new FormData();
    form.append("file", file);
    form.append("session_id", sid);
    setUploadProgress(true);
    try {
      const res = await fetch(`${apiBase}/api/chat/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.file_url) return data;
      return null;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    } finally {
      setUploadProgress(false);
    }
  };

  // ── Send message helper ─────────────────────────────────────────────────────
  const sendMessage = async ({ text = "", message_type = "text", file_url = "" }) => {
    if (!sessionId || !apiBase) return;
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, sender: 'user', message_type, text, file_url,
      created_at: new Date().toISOString()
    }]);
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', session_id: sessionId, message_type, text, file_url }),
      });
      if (!res.ok) setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ── Text send ───────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || !apiBase || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    setIsLoading(true);
    await sendMessage({ text, message_type: "text" });

    if (expectingTrackingCode) {
      setExpectingTrackingCode(false);
      try {
        const res = await fetch(`${apiBase}/api/orders/${text}`, {
          cache: 'no-store',
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          let msgText = `سفارش شما با کد پیگیری ${text} یافت شد:\n\n` +
                        `وضعیت: ${data.status_fa}\n`;
          if (data.estimated_time) {
            msgText += `زمان تقریبی تکمیل: ${data.estimated_time}\n`;
          }
          if (data.created_xbox_email) {
            msgText += `ایمیل ایکس‌باکس: ${data.created_xbox_email}\n` +
                        `رمز ایکس‌باکس: ${data.created_xbox_pass}\n`;
          }
          
          setBotMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            sender: "admin",
            message_type: "text",
            text: msgText,
            created_at: new Date().toISOString()
          }]);
        } else {
          setBotMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            sender: "admin",
            message_type: "text",
            text: "سفارشی با این کد پیگیری پیدا نشد. لطفاً کد را مجدداً و به درستی وارد کنید یا منتظر پشتیبان بمانید.",
            created_at: new Date().toISOString()
          }]);
        }
      } catch (err) {
        setBotMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: "admin",
          message_type: "text",
          text: "خطا در برقراری ارتباط. لطفاً بعداً تلاش کنید.",
          created_at: new Date().toISOString()
        }]);
      }
    }
    setIsLoading(false);
  };

  const handleQuickReply = async (type) => {
    let sid = sessionId;
    if (!sid) {
      await initChat();
      sid = localStorage.getItem("liveChatSessionId");
      setSessionId(sid);
    }
    if (!sid || !apiBase || isLoading) return;
    
    if (type === "track") {
      await sendMessage({ text: "🔍 پیگیری وضعیت و زمان سفارش", message_type: "text" });
      setExpectingTrackingCode(true);
      setTimeout(() => {
        setBotMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: "admin",
          message_type: "text",
          text: "لطفاً کد پیگیری سفارش خود را وارد کنید (مثال: 123456):",
          created_at: new Date().toISOString()
        }]);
      }, 600);
    } else if (type === "2fa") {
      await sendMessage({ text: "❓ راهنمای غیرفعال‌سازی 2FA", message_type: "text" });
      setTimeout(() => {
        setBotMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: "admin",
          message_type: "text",
          text: "برای خاموش کردن تایید دو مرحله‌ای (2FA):\n۱. وارد سایت Epic Games یا اکانت خود شوید.\n۲. به بخش تنظیمات حساب (Account Settings) و سپس بخش رمز عبور و امنیت (Password & Security) بروید.\n۳. گزینه Two-Factor Authentication را خاموش کنید.",
          created_at: new Date().toISOString()
        }]);
      }, 600);
    } else if (type === "hours") {
      await sendMessage({ text: "📞 ساعات کاری پشتیبانی", message_type: "text" });
      setTimeout(() => {
        setBotMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: "admin",
          message_type: "text",
          text: "ساعات کاری پشتیبانی تلفنی:\nشنبه تا چهارشنبه از ۱۱:۰۰ الی ۱۶:۰۰\nیکشنبه‌ها از ۱۳:۰۰ الی ۱۶:۰۰\n\nپشتیبانی تلگرام به صورت ۲۴ ساعته در آی‌دی @Nubixsupport پاسخگوی شماست.",
          created_at: new Date().toISOString()
        }]);
      }, 600);
    }
  };

  // ── File/image/video pick ───────────────────────────────────────────────────
  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    let sid = sessionId;
    if (!sid) {
      await initChat();
      sid = localStorage.getItem("liveChatSessionId");
      setSessionId(sid);
    }

    const result = await uploadFile(file, sid);
    if (result?.file_url) {
      await sendMessage({ message_type: result.message_type, file_url: result.file_url });
    }
  };

  // ── Clipboard paste handler (Ctrl+V) ────────────────────────────────────────
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        e.preventDefault();

        let sid = sessionId;
        if (!sid) {
          await initChat();
          sid = localStorage.getItem("liveChatSessionId");
          setSessionId(sid);
        }

        const result = await uploadFile(file, sid);
        if (result?.file_url) {
          await sendMessage({ message_type: result.message_type, file_url: result.file_url });
        }
        break;
      }
    }
  };

  // ── Voice recording ─────────────────────────────────────────────────────────
  const showVoiceToast = (msg) => {
    setVoiceToast(msg);
    setTimeout(() => setVoiceToast(''), 2500);
  };

  const startCooldown = () => {
    clearInterval(voiceCooldownRef.current);
    setVoiceCooldown(VOICE_COOLDOWN_SEC);
    voiceCooldownRef.current = setInterval(() => {
      setVoiceCooldown(prev => {
        if (prev <= 1) { clearInterval(voiceCooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (isRecording || voiceCooldown > 0) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // ── Real-time audio analyser ──────────────────────────────────────────
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;                 // 32 frequency bins
      analyser.smoothingTimeConstant = 0.75; // smooth rapid changes
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = audioCtx;
      const freqData = new Uint8Array(analyser.frequencyBinCount); // 32 bins
      const BAR_COUNT = 8;
      const binsPerBar = Math.floor(freqData.length / BAR_COUNT);
      const drawFrame = () => {
        analyser.getByteFrequencyData(freqData);
        const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
          let sum = 0;
          for (let j = 0; j < binsPerBar; j++) sum += freqData[i * binsPerBar + j];
          return sum / (binsPerBar * 255); // normalise 0–1
        });
        setWaveformData(bars);
        animFrameRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();
      // ─────────────────────────────────────────────────────────────────────

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordSecondsRef.current = 0;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        // Stop visualiser
        cancelAnimationFrame(animFrameRef.current);
        audioCtxRef.current?.close().catch(() => {});
        setWaveformData(Array(8).fill(0));

        stream.getTracks().forEach(t => t.stop());
        clearInterval(recordTimerRef.current);
        const duration = recordSecondsRef.current;
        setRecordSeconds(0);
        recordSecondsRef.current = 0;

        if (duration < MIN_VOICE_SECONDS) {
          showVoiceToast('پیام خیلی کوتاه است');
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

        let sid = sessionId;
        if (!sid) {
          await initChat();
          sid = localStorage.getItem("liveChatSessionId");
          setSessionId(sid);
        }

        const result = await uploadFile(file, sid);
        if (result?.file_url) {
          await sendMessage({ message_type: "audio", file_url: result.file_url });
          startCooldown();
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      recordTimerRef.current = setInterval(() => {
        recordSecondsRef.current += 1;
        setRecordSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatSeconds = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (pathname && pathname.startsWith('/panel/admin')) return null;

  return (
    <div className="live-chat-wrapper">
      {isOpen && (
        <div className="live-chat-window glass-panel">
          <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar-group" aria-label="تیم پشتیبانی نوبیکس">
                  <span className="chat-avatar-pic">
                    <img src="/support-team/agent-2.webp" alt="کارشناس پشتیبانی" loading="lazy" />
                  </span>
                  <span className="chat-avatar-pic">
                    <img src="/support-team/agent-1.webp" alt="کارشناس پشتیبانی" loading="lazy" />
                  </span>
                  <span className="online-indicator"></span>
                </div>
              <div>
                <h4>پشتیبانی آنلاین نوبیکس</h4>
                <p>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginRight: 4 }}></span>
                  تیم پشتیبانی آماده کمک به شماست
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={toggleChat} aria-label="بستن چت">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {allMessages.length === 0 ? (
              <div className="chat-bubble-wrapper is-user">
                <div className="chat-bubble bubble-admin auto-message-bubble">
                  <p style={{ margin: 0 }}>
                    برای پاسخ عجله دارید؟ پشتیبانی در{' '}
                    <a
                      href="https://t.me/NubixSupport"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="auto-message-link"
                    >
                      شبکه‌های اجتماعی
                    </a>{' '}
                    آنلاین است
                  </p>
                  <span className="chat-time">
                    {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ) : (
              allMessages.map((msg, index) => {
                const prevMsg = index > 0 ? allMessages[index - 1] : null;
                const showDivider = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDivider && (
                      <div className="chat-date-divider">
                        <span>{formatDividerDate(msg.created_at)}</span>
                      </div>
                    )}
                    <div className={`chat-bubble-wrapper ${msg.sender === 'user' ? 'is-admin' : 'is-user'}`}>
                      <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-admin' : 'bubble-user'} ${msg.message_type !== 'text' ? 'bubble-media' : ''} ${msg.text ? 'has-caption' : ''}`}>
                        {msg.message_type === 'text' ? msg.text : <MediaBubble msg={msg} apiBase={apiBase} />}
                        <span className="chat-time">
                          {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recording indicator with live waveform */}
          {isRecording && (
            <div className="recording-indicator">
              <div className="rec-waveform">
                {waveformData.map((v, i) => (
                  <div
                    key={i}
                    className="rec-waveform-bar"
                    style={{ height: `${Math.max(3, Math.round(v * 28))}px` }}
                  />
                ))}
              </div>
              <span className="rec-timer">{formatSeconds(recordSeconds)}</span>
              <button className="rec-stop-btn" onClick={stopRecording} aria-label="توقف ضبط">
                <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              </button>
            </div>
          )}

          {/* Voice toast — floats above the input bar */}
          {voiceToast && (
            <div className="voice-toast-overlay">
              <span className="voice-toast">{voiceToast}</span>
            </div>
          )}

          {/* Quick replies bar */}
          {!isRecording && sessionId && (
            <div className="chat-quick-replies">
              <button
                type="button"
                className="quick-reply-btn track"
                onClick={() => handleQuickReply("track")}
              >
                🔍 پیگیری وضعیت و زمان سفارش
              </button>
              <button
                type="button"
                className="quick-reply-btn guide"
                onClick={() => handleQuickReply("2fa")}
              >
                ❓ راهنمای غیرفعال‌سازی 2FA
              </button>
              <button
                type="button"
                className="quick-reply-btn hours"
                onClick={() => handleQuickReply("hours")}
              >
                📞 ساعات کاری پشتیبانی
              </button>
            </div>
          )}

          <form className="chat-input-area" onSubmit={handleSend}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              id="chat-file-input"
            />

            {/* Attach button */}
            <button
              type="button"
              className="chat-media-btn"
              onClick={handleFilePick}
              disabled={isLoading || uploadProgress || isRecording || !sessionId}
              aria-label="ارسال فایل"
              title="تصویر یا ویدیو"
            >
              {uploadProgress ? (
                <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              )}
            </button>

            {/* Mic button */}
            <button
              type="button"
              className={`chat-media-btn${isRecording ? ' is-recording' : ''}${voiceCooldown > 0 && !isRecording ? ' mic-cooldown' : ''}`}
              onMouseDown={!voiceCooldown ? startRecording : undefined}
              onClick={isRecording ? stopRecording : undefined}
              disabled={isLoading || uploadProgress || (!isRecording && voiceCooldown > 0)}
              aria-label={isRecording ? "توقف ضبط" : "ضبط صدا"}
              title={voiceCooldown > 0 && !isRecording ? `${voiceCooldown}ثانیه صبر کن` : isRecording ? "توقف ضبط" : "پیام صوتی"}
            >
              {isRecording ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : voiceCooldown > 0 ? (
                <span style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>{voiceCooldown}</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>

            <input
              type="text"
              placeholder="پیام خود را بنویسید..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              disabled={isLoading || !sessionId || isRecording}
            />
            <button type="submit" disabled={!inputText.trim() || isLoading || !sessionId || isRecording} aria-label="ارسال">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}

      {!isOpen && showGreeting && (
        <div className="chat-greeting-tooltip glass-panel" onClick={toggleChat}>
          <button className="greeting-close-btn" onClick={handleDismissGreeting} aria-label="بستن">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="greeting-content">
            <span className="greeting-wave">👋</span>
            <p>اگر به کمک نیاز دارید، ما اینجا هستیم!</p>
          </div>
        </div>
      )}

      <button className="live-chat-fab" onClick={toggleChat} aria-label="چت با پشتیبانی">
        {!isOpen && unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
        {isOpen ? (
          <svg className="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg className="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
