"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ── Admin Widget ──────────────────────────────────────────────────────────────
export default function AdminLiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Media state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [voiceCooldown, setVoiceCooldown] = useState(0);
  const [voiceToast, setVoiceToast] = useState('');

  const MIN_VOICE_SECONDS = 1;
  const VOICE_COOLDOWN_SEC = 4;
  const voiceCooldownRef = useRef(null);
  const recordSecondsRef = useRef(0);
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

  const totalUnread = sessions.reduce((acc, s) => acc + (s.unread || 0), 0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Poll sessions ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiBase) return;
    let intervalId;
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/chat?action=sessions`);
        const data = await res.json();
        if (data.sessions) setSessions(data.sessions);
      } catch (err) {}
    };
    fetchSessions();
    intervalId = setInterval(fetchSessions, 5000);
    return () => clearInterval(intervalId);
  }, [apiBase]);

  // ── Poll messages for active session ────────────────────────────────────────
  useEffect(() => {
    if (!activeSessionId || !apiBase) return;
    let intervalId;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/chat?action=messages&session_id=${activeSessionId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(prev => {
            const serverMsgs = data.messages;
            // Keep optimistic admin messages that the server hasn't confirmed yet.
            const pendingTemp = prev.filter(m =>
              typeof m.id === 'string' && m.id.startsWith('temp-') &&
              !serverMsgs.some(sm =>
                sm.sender === 'admin' &&
                sm.message_type === m.message_type &&
                (sm.text || '') === (m.text || '') &&
                (sm.file_url || '') === (m.file_url || '')
              )
            );
            const combined = [...serverMsgs, ...pendingTemp].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            if (combined.length > prev.length && isOpen) {
              setTimeout(scrollToBottom, 100);
            }
            return combined;
          });
        }
      } catch (err) {}
    };
    fetchMessages();
    intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [activeSessionId, apiBase, isOpen, scrollToBottom]);

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setMessages([]);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, unread: 0 } : s));
  };

  // ── Upload helper ───────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    if (!activeSessionId || !apiBase) return null;
    const form = new FormData();
    form.append("file", file);
    form.append("session_id", activeSessionId);
    setUploadProgress(true);
    try {
      const res = await fetch(`${apiBase}/api/chat/upload`, { method: 'POST', body: form });
      const data = await res.json();
      return data.file_url ? data : null;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    } finally {
      setUploadProgress(false);
    }
  };

  // ── Send message helper ─────────────────────────────────────────────────────
  const sendMessage = async ({ text = "", message_type = "text", file_url = "" }) => {
    if (!activeSessionId || !apiBase) return;
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, sender: 'admin', message_type, text, file_url,
      created_at: new Date().toISOString()
    }]);
    setTimeout(scrollToBottom, 50);
    try {
      const res = await fetch(`${apiBase}/api/admin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', session_id: activeSessionId, message_type, text, file_url }),
      });
      if (!res.ok) setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ── Text send ───────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionId || isLoading || isRecording) return;
    const text = inputText.trim();
    setInputText("");
    setIsLoading(true);
    await sendMessage({ text, message_type: "text" });
    setIsLoading(false);
  };

  // ── File pick ───────────────────────────────────────────────────────────────
  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await uploadFile(file);
    if (result?.file_url) await sendMessage({ message_type: result.message_type, file_url: result.file_url });
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

        if (!activeSessionId) return;

        const result = await uploadFile(file);
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
    if (isRecording || voiceCooldown > 0 || !activeSessionId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // ── Real-time audio analyser ──────────────────────────────────────────
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = audioCtx;
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const BAR_COUNT = 8;
      const binsPerBar = Math.floor(freqData.length / BAR_COUNT);
      const drawFrame = () => {
        analyser.getByteFrequencyData(freqData);
        const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
          let sum = 0;
          for (let j = 0; j < binsPerBar; j++) sum += freqData[i * binsPerBar + j];
          return sum / (binsPerBar * 255);
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
        const result = await uploadFile(file);
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
    } catch (err) { console.error("Mic denied", err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatSeconds = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const closeActiveChat = () => setActiveSessionId(null);

  const toggleWidget = () => {
    setIsOpen(prev => !prev);
    if (isOpen) setActiveSessionId(null);
  };

  // ── Delete session (admin) ──────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);

  const deleteSession = async (sessionId, { skipConfirm = false, label = 'این گفتگو' } = {}) => {
    if (!apiBase || !sessionId) return;
    if (!skipConfirm) {
      const ok = window.confirm(`${label} برای همیشه حذف شود؟ این عملیات غیرقابل بازگشت است.`);
      if (!ok) return;
    }
    setDeletingId(sessionId);
    try {
      const res = await fetch(`${apiBase}/api/admin/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', session_id: sessionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'حذف گفتگو با خطا مواجه شد');
        return;
      }
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      alert('حذف گفتگو با خطا مواجه شد');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFromList = (e, session) => {
    e.stopPropagation();
    e.preventDefault();
    deleteSession(session.id, { label: `گفتگو با «${session.name}»` });
  };

  const handleDeleteActive = () => {
    const active = sessions.find(s => s.id === activeSessionId);
    const label = active ? `گفتگو با «${active.name}»` : 'این گفتگو';
    deleteSession(activeSessionId, { label });
  };

  return (
    <div className="live-chat-wrapper admin-chat-wrapper">
      {isOpen && (
        <div className="live-chat-window glass-panel">
          {activeSessionId ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <button className="chat-close-btn" onClick={closeActiveChat} style={{ marginLeft: '10px' }} aria-label="بازگشت">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div className="chat-avatar">
                    <span className="online-indicator"></span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h4>{sessions.find(s => s.id === activeSessionId)?.name || 'کاربر'}</h4>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button
                    type="button"
                    className="chat-header-delete-btn"
                    onClick={handleDeleteActive}
                    disabled={deletingId === activeSessionId}
                    aria-label="حذف گفتگو"
                    title="حذف گفتگو"
                  >
                    {deletingId === activeSessionId ? (
                      <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6M14 11v6"></path>
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty"><p>در حال بارگذاری گفتگو...</p></div>
                ) : (
                  messages.map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDivider = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                    
                    return (
                      <React.Fragment key={msg.id}>
                        {showDivider && (
                          <div className="chat-date-divider">
                            <span>{formatDividerDate(msg.created_at)}</span>
                          </div>
                        )}
                        <div className={`chat-bubble-wrapper ${msg.sender === 'admin' ? 'is-admin' : 'is-user'}`}>
                          <div className={`chat-bubble ${msg.sender === 'admin' ? 'bubble-user' : 'bubble-admin'} ${msg.message_type !== 'text' ? 'bubble-media' : ''} ${msg.text ? 'has-caption' : ''}`}>
                            {msg.is_ai && (
                              <span className="ai-reply-badge" title="پاسخ خودکار دستیار هوش مصنوعی">🤖 پاسخ هوش مصنوعی</span>
                            )}
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

              <form className="chat-input-area" onSubmit={handleSend}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  id="admin-chat-file-input"
                />

                {/* Attach */}
                <button
                  type="button"
                  className="chat-media-btn"
                  onClick={handleFilePick}
                  disabled={isLoading || uploadProgress || isRecording}
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

                {/* Mic */}
                <button
                  type="button"
                  className={`chat-media-btn${isRecording ? ' is-recording' : ''}${voiceCooldown > 0 && !isRecording ? ' mic-cooldown' : ''}`}
                  onClick={isRecording ? stopRecording : (!voiceCooldown ? startRecording : undefined)}
                  disabled={isLoading || uploadProgress || (!isRecording && voiceCooldown > 0)}
                  aria-label={isRecording ? "توقف ضبط" : "ضبط صدا"}
                  title={voiceCooldown > 0 && !isRecording ? `${voiceCooldown}ثانیه صبر کن` : isRecording ? "توقف ضبط" : "پیام صوتی"}
                >
                  {isRecording ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
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
                  placeholder="پاسخ خود را بنویسید..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPaste={handlePaste}
                  disabled={isLoading || isRecording}
                />
                <button type="submit" disabled={!inputText.trim() || isLoading || isRecording} aria-label="ارسال">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div>
                    <h4>مدیریت چت‌های آنلاین</h4>
                    <p>{sessions.length} گفتگو فعال</p>
                  </div>
                </div>
                <button className="chat-close-btn" onClick={toggleWidget} aria-label="بستن">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="sessions-list">
                {sessions.length === 0 ? (
                  <div className="chat-empty">
                    <svg className="chat-empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0.5 0.5 0 00.312.825c.883.18 1.834-.047 2.58-.517.382-.24.843-.284 1.258-.15A8.96 8.96 0 0012 20.25z" />
                    </svg>
                    <p>هیچ گفتگوی فعالی نیست</p>
                    <p className="chat-empty-sub">کاربران جدید به محض ارسال پیام اینجا ظاهر می‌شوند.</p>
                  </div>
                ) : (
                  sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`session-item ${session.id === activeSessionId ? 'active-session' : ''} ${session.unread > 0 ? 'unread-session' : ''}`}
                    >
                      <div className="session-details">
                        <div className="session-avatar">{session.name.charAt(0)}</div>
                        <div className="session-text-info">
                          <div className="session-name" title={session.name}>{session.name}</div>
                          <div className="session-time">
                            {new Date(session.updated_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="session-actions">
                        {session.unread > 0 && (
                          <div className="session-unread-badge">{session.unread} جدید</div>
                        )}
                        <button
                          type="button"
                          className="session-delete-btn"
                          onClick={(e) => handleDeleteFromList(e, session)}
                          disabled={deletingId === session.id}
                          aria-label="حذف گفتگو"
                          title="حذف گفتگو"
                        >
                          {deletingId === session.id ? (
                            <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                              <path d="M10 11v6M14 11v6"></path>
                              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      <button
        className="live-chat-fab"
        onClick={toggleWidget}
        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        aria-label="مدیریت چت"
      >
        {!isOpen && totalUnread > 0 && (
          <span className="unread-badge">{totalUnread}</span>
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
