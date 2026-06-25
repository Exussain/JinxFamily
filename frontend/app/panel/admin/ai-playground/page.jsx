"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function AIPlaygroundPage() {
  const [tab, setTab] = useState("replay"); // "replay" | "test" | "context"
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [replayData, setReplayData] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState([]); // [{role, content}]
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const sessionsCacheRef = useRef([]);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(""); // "" = default chain
  const [defaultModelId, setDefaultModelId] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [maxTier, setMaxTier] = useState("premium");
  const [tierOrder, setTierOrder] = useState({});

  // Load models list once (live from gateway, curated fallback)
  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-playground?action=models`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setModels(data.models || []);
      setDefaultModelId(data.configured_model || data.default_model || "");
      setMaxTier(data.max_tier || "premium");
      setTierOrder(data.tier_order || {});
    } catch (e) {
      setError("خطا در دریافت لیست مدل‌ها: " + e.message);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  // Load sessions list once
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-playground?action=sessions`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      sessionsCacheRef.current = data.sessions || [];
    } catch (e) {
      setError("خطا در دریافت لیست سشن‌ها: " + e.message);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadModels();
  }, [loadSessions, loadModels]);

  // Replay a session (real conversation + dry-run AI reply)
  const replaySession = useCallback(async (sessionId) => {
    setSelectedSession(sessionId);
    setReplayLoading(true);
    setReplayData(null);
    setError("");
    try {
      const modelParam = selectedModel ? `&model=${encodeURIComponent(selectedModel)}` : "";
      const res = await fetch(
        `${API_BASE}/api/admin/ai-playground?action=replay&session_id=${sessionId}${modelParam}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReplayData(data);
    } catch (e) {
      setError("خطا در replay: " + e.message);
    } finally {
      setReplayLoading(false);
    }
  }, [selectedModel]);

  // Fetch context dump for selected session
  const loadContext = useCallback(async (sessionId) => {
    setContextLoading(true);
    setContextData(null);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/ai-playground?action=context&session_id=${sessionId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContextData(data);
    } catch (e) {
      setError("خطا در دریافت context: " + e.message);
    } finally {
      setContextLoading(false);
    }
  }, []);

  // Send a free-form test message
  const sendTest = useCallback(async () => {
    const msg = testInput.trim();
    if (!msg || testLoading) return;
    setTestLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-playground?action=test`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: testHistory.filter((h) => h.role && h.content).slice(-20).map((h) => ({ role: h.role, content: h.content })),
          model: selectedModel || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ai_error && !data.ai_reply) {
        setError(data.ai_error);
      }
      // Append to local history view
      setTestHistory((prev) => [
        ...prev,
        { role: "user", content: msg, ts: Date.now() },
        ...(data.ai_reply
          ? [{ role: "assistant", content: data.ai_reply, ts: Date.now(), elapsed: data.ai_elapsed_ms, model: data.model_used, usage: data.usage || {} }]
          : []),
      ]);
      setTestInput("");
    } catch (e) {
      setError("خطا در تست: " + e.message);
    } finally {
      setTestLoading(false);
    }
  }, [testInput, testLoading, testHistory, selectedModel]);

  // Save the selected model as the default (updates SiteSetting)
  const saveDefaultModel = useCallback(async () => {
    if (!selectedModel || savingModel) return;
    setSavingModel(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-playground?action=set-default-model`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        setDefaultModelId(selectedModel);
        setError("");
      } else {
        throw new Error(data.error || "خطا");
      }
    } catch (e) {
      setError("خطا در ذخیره مدل پیش‌فرض: " + e.message);
    } finally {
      setSavingModel(false);
    }
  }, [selectedModel, savingModel]);

  const filteredSessions = (sessionsCacheRef.current.length ? sessionsCacheRef.current : sessions).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.last_user_text?.toLowerCase().includes(q) ||
      s.first_text?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="ai-pg-wrap">
      <header className="ai-pg-header">
        <div className="ai-pg-title">
          <span className="ai-pg-emoji">🧪</span>
          <h1>AI Playground</h1>
          <span className={`ai-pg-badge ${replayData?.ai_enabled ? "on" : "off"}`}>
            AI {replayData?.ai_enabled === false ? "غیرفعال" : "فعال"}
          </span>
        </div>
        <div className="ai-pg-nav">
          <Link href="/panel/admin" className="ai-pg-back">← بازگشت به پنل ادمین</Link>
          <button onClick={loadSessions} className="ai-pg-refresh" disabled={sessionsLoading}>
            {sessionsLoading ? "…" : "⟳"}
          </button>
        </div>
      </header>

      <div className="ai-pg-tabs">
        <button className={tab === "replay" ? "active" : ""} onClick={() => setTab("replay")}>
          📜 Replay واقعی
        </button>
        <button className={tab === "test" ? "active" : ""} onClick={() => setTab("test")}>
          🧪 تست آزاد
        </button>
        <button className={tab === "context" ? "active" : ""} onClick={() => setTab("context")}>
          🔍 Context
        </button>
      </div>

      <div className="ai-pg-model-bar">
        <label className="ai-pg-model-label">🤖 مدل:</label>
        <select
          className="ai-pg-model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={modelsLoading}
          title={modelsLoading ? "در حال بارگذاری مدل‌ها…" : "مدل را انتخاب کنید"}
        >
          <option value="">⚡ زنجیره پیش‌فرض (default chain)</option>
          {models
            .filter((m) => {
              const level = tierOrder[m.tier] || 3;
              const maxLevel = tierOrder[maxTier] || 3;
              return level <= maxLevel;
            })
            .map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}{m.id === defaultModelId ? " ✓ پیش‌فرض" : ""}{m.cost_out ? ` [${m.cost_out}$]` : ""}
            </option>
          ))}
        </select>
        {selectedModel && selectedModel !== defaultModelId && (
          <button
            className="ai-pg-set-default"
            onClick={saveDefaultModel}
            disabled={savingModel}
          >
            {savingModel ? "…" : "✦ تنظیم به‌عنوان پیش‌فرض"}
          </button>
        )}
        {replayData?.model_used && (
          <span className="ai-pg-model-used">
            استفاده‌شده: <code>{replayData.model_used}</code>
            {replayData.usage?.total_tokens != null && (
              <span className="ai-pg-tokens"> · {replayData.usage.total_tokens} توکن</span>
            )}
          </span>
        )}
        {defaultModelId && (
          <span className="ai-pg-model-configured">پیکربندی‌شده: {models.find(m => m.id === defaultModelId)?.label || defaultModelId}</span>
        )}
        {modelsLoading && <span className="ai-pg-model-hint">…بارگذاری مدل‌ها</span>}
      </div>

      {error && <div className="ai-pg-error">⚠️ {error}</div>}

      <div className="ai-pg-body">
        {(tab === "replay" || tab === "context") && (
          <aside className="ai-pg-sessions">
            <div className="ai-pg-sessions-head">
              <h2>سشن‌های واقعی ({filteredSessions.length})</h2>
              <input
                type="text"
                placeholder="جستجو…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ai-pg-search"
              />
            </div>
            <div className="ai-pg-sessions-list">
              {sessionsLoading && <div className="ai-pg-empty">در حال بارگذاری…</div>}
              {!sessionsLoading && filteredSessions.length === 0 && (
                <div className="ai-pg-empty">سشنی یافت نشد</div>
              )}
              {!sessionsLoading &&
                filteredSessions.map((s) => (
                  <button
                    key={s.id}
                    className={`ai-pg-session-item ${selectedSession === s.id ? "selected" : ""}`}
                    onClick={() => {
                      if (tab === "context") loadContext(s.id);
                      else replaySession(s.id);
                    }}
                  >
                    <div className="ai-pg-session-top">
                      <span className="ai-pg-session-name">{s.name}</span>
                      <span className="ai-pg-session-count">{s.user_msgs} پیام</span>
                    </div>
                    <div className="ai-pg-session-last">{s.last_user_text || s.first_text || "—"}</div>
                    <div className="ai-pg-session-date">
                      {s.updated_at?.slice(0, 10)} · {s.status === "open" ? "باز" : "بسته"}
                    </div>
                  </button>
                ))}
            </div>
          </aside>
        )}

        {tab === "replay" && (
          <main className="ai-pg-main">
            {!selectedSession && <div className="ai-pg-empty-main">یک سشن از لیست سمت راست انتخاب کنید تا مکالمه واقعی + پاسخ AI نمایش داده شود.</div>}
            {selectedSession && replayLoading && <div className="ai-pg-empty-main">در حال ساخت پاسخ AI… (می‌تواند چند ثانیه طول بکشد)</div>}
            {selectedSession && !replayLoading && replayData && (
              <>
                <div className="ai-pg-conv-head">
                  <div>
                    <strong>{replayData.session.name}</strong>
                    <span className="ai-pg-conv-meta">
                      {" "}· {replayData.session.status === "open" ? "باز" : "بسته"} ·{" "}
                      {replayData.session.created_at?.slice(0, 10)}
                    </span>
                  </div>
                  <button className="ai-pg-regen" onClick={() => replaySession(selectedSession)}>
                    ⟳ پاسخ دوباره
                  </button>
                </div>

                <div className="ai-pg-conv">
                  {replayData.messages.map((m, i) => (
                    <div key={m.id || i} className={`ai-pg-msg ${m.sender === "admin" ? "admin" : "user"}`}>
                      <div className="ai-pg-msg-meta">
                        <span className="ai-pg-msg-sender">
                          {m.sender === "admin" ? (m.is_ai ? "🤖 AI" : "👤 ادمین واقعی") : "🙋 کاربر"}
                        </span>
                        <span className="ai-pg-msg-time">{m.date} {m.time}</span>
                      </div>
                      <div className="ai-pg-msg-text">{m.text || `[${m.message_type}]`}</div>
                    </div>
                  ))}
                </div>

                <div className="ai-pg-ai-reply">
                  <div className="ai-pg-ai-reply-head">
                    <span>🤖 پاسخ AI (dry-run — ذخیره نمی‌شود)</span>
                    <span className="ai-pg-msg-meta-right">
                      {replayData.model_used && replayData.model_used !== "default-chain" && (
                        <span className="ai-pg-model-badge">{replayData.model_used.split("/").pop()}</span>
                      )}
                      {replayData.usage?.total_tokens != null && (
                        <span className="ai-pg-tokens">{replayData.usage.total_tokens} توکن</span>
                      )}
                      {replayData.ai_elapsed_ms > 0 && (
                        <span className="ai-pg-elapsed">{replayData.ai_elapsed_ms}ms</span>
                      )}
                    </span>
                  </div>
                  {replayData.ai_error && !replayData.ai_dry_run_reply && (
                    <div className="ai-pg-ai-error">⚠️ {replayData.ai_error}</div>
                  )}
                  {replayData.ai_dry_run_reply ? (
                    <div className="ai-pg-ai-reply-text">{replayData.ai_dry_run_reply}</div>
                  ) : (
                    !replayData.ai_error && <div className="ai-pg-ai-reply-text muted">(پاسخی تولید نشد)</div>
                  )}
                </div>
              </>
            )}
          </main>
        )}

        {tab === "test" && (
          <main className="ai-pg-main ai-pg-test-main">
            <div className="ai-pg-test-info">
              در این حالت می‌توانید پیام دلخواه بفرستید و پاسخ AI را ببینید. هیچ چیزی در دیتابیس ذخیره نمی‌شود.
              context فقط شامل system prompt است (بدون تاریخچه سشن واقعی).
            </div>
            <div className="ai-pg-conv">
              {testHistory.length === 0 && (
                <div className="ai-pg-empty-main">پیام خود را بنویسید و ارسال کنید…</div>
              )}
              {testHistory.map((m, i) => (
                <div key={i} className={`ai-pg-msg ${m.role === "assistant" ? "admin" : "user"}`}>
                  <div className="ai-pg-msg-meta">
                    <span className="ai-pg-msg-sender">
                      {m.role === "assistant" ? "🤖 AI" : "🙋 شما"}
                    </span>
                    <span className="ai-pg-msg-meta-right">
                      {m.elapsed != null && <span className="ai-pg-elapsed">{m.elapsed}ms</span>}
                      {m.model && m.model !== "default-chain" && <span className="ai-pg-model-badge">{m.model.split("/").pop()}</span>}
                      {m.usage?.total_tokens != null && <span className="ai-pg-tokens">{m.usage.total_tokens} توکن</span>}
                    </span>
                  </div>
                  <div className="ai-pg-msg-text">{m.content}</div>
                </div>
              ))}
              {testLoading && <div className="ai-pg-msg admin"><div className="ai-pg-msg-text muted">AI در حال پاسخ…</div></div>}
            </div>
            <div className="ai-pg-test-input">
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTest();
                  }
                }}
                placeholder="مثلاً: قیمت ویباکس فورتنایت چنده؟"
                rows={2}
              />
              <button onClick={sendTest} disabled={testLoading || !testInput.trim()}>
                {testLoading ? "…" : "ارسال ↵"}
              </button>
              {testHistory.length > 0 && (
                <button className="ai-pg-clear" onClick={() => setTestHistory([])}>پاک کردن</button>
              )}
            </div>
          </main>
        )}

        {tab === "context" && (
          <main className="ai-pg-main">
            {!selectedSession && <div className="ai-pg-empty-main">یک سشن انتخاب کنید تا context کامل که مدل می‌بیند نمایش داده شود.</div>}
            {selectedSession && contextLoading && <div className="ai-pg-empty-main">در حال ساخت context…</div>}
            {selectedSession && !contextLoading && contextData && (
              <div className="ai-pg-context">
                <details open>
                  <summary>System Prompt ({contextData.system_prompt?.length || 0} chars)</summary>
                  <pre>{contextData.system_prompt}</pre>
                </details>
                {contextData.order_context && (
                  <details open>
                    <summary>Order Context ({contextData.order_context.length} chars)</summary>
                    <pre>{contextData.order_context || "(خالی — کاربر مهمان یا سفارشی ندارد)"}</pre>
                  </details>
                )}
                <details>
                  <summary>Messages ساخته‌شده برای مدل ({contextData.messages_count} پیام)</summary>
                  <div className="ai-pg-context-msgs">
                    {contextData.messages_built?.map((m, i) => (
                      <div key={i} className={`ai-pg-ctx-msg ${m.role}`}>
                        <span className="ai-pg-ctx-role">{m.role}</span>
                        <pre>{m.content}</pre>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </main>
        )}
      </div>

      <style jsx>{`
        .ai-pg-wrap {
          direction: rtl;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: inherit;
          color: #e5e7eb;
          background: #0b0f17;
          min-height: 100vh;
        }
        .ai-pg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #1f2937;
          margin-bottom: 16px;
        }
        .ai-pg-title { display: flex; align-items: center; gap: 10px; }
        .ai-pg-title h1 { font-size: 22px; margin: 0; color: #fff; }
        .ai-pg-emoji { font-size: 26px; }
        .ai-pg-badge {
          font-size: 11px; padding: 3px 8px; border-radius: 999px; font-weight: 600;
        }
        .ai-pg-badge.on { background: rgba(16,185,129,0.15); color: #34d399; }
        .ai-pg-badge.off { background: rgba(239,68,68,0.15); color: #f87171; }
        .ai-pg-nav { display: flex; align-items: center; gap: 12px; }
        .ai-pg-back { color: #9ca3af; font-size: 13px; text-decoration: none; }
        .ai-pg-back:hover { color: #fff; }
        .ai-pg-refresh {
          background: #1f2937; border: none; color: #e5e7eb; width: 32px; height: 32px;
          border-radius: 8px; cursor: pointer; font-size: 16px;
        }
        .ai-pg-refresh:hover { background: #374151; }
        .ai-pg-model-bar {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          padding: 10px 14px; background: #111827; border: 1px solid #1f2937;
          border-radius: 10px; margin-bottom: 14px;
        }
        .ai-pg-model-label { font-size: 13px; font-weight: 600; color: #d1d5db; white-space: nowrap; }
        .ai-pg-model-select {
          background: #0b0f17; border: 1px solid #374151; color: #e5e7eb;
          padding: 5px 10px; border-radius: 6px; font-size: 12px; max-width: 260px;
        }
        .ai-pg-model-used { font-size: 11px; color: #9ca3af; }
        .ai-pg-model-hint { font-size: 11px; color: #6b7280; }
        .ai-pg-set-default {
          background: #1f2937; border: 1px solid #374151; color: #fbbf24;
          padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; white-space: nowrap;
        }
        .ai-pg-set-default:hover { background: #374151; }
        .ai-pg-set-default:disabled { color: #6b7280; cursor: not-allowed; }
        .ai-pg-model-configured { font-size: 11px; color: #6b7280; }
        .ai-pg-model-badge {
          font-size: 10px; background: rgba(167,139,250,0.15); color: #a78bfa;
          padding: 1px 6px; border-radius: 4px; font-family: monospace;
        }
        .ai-pg-tokens {
          font-size: 10px; color: #6b7280; font-family: monospace;
          background: #1f2937; padding: 1px 6px; border-radius: 4px;
        }
        .ai-pg-msg-meta-right { display: flex; align-items: center; gap: 6px; }

        .ai-pg-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
        .ai-pg-tabs button {
          background: #1f2937; border: 1px solid #374151; color: #9ca3af;
          padding: 8px 16px; border-radius: 8px 8px 0 0; cursor: pointer; font-size: 13px;
        }
        .ai-pg-tabs button.active {
          background: #111827; color: #fff; border-bottom-color: #111827;
        }

        .ai-pg-error {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;
        }

        .ai-pg-body { display: flex; gap: 16px; min-height: 70vh; }
        .ai-pg-sessions {
          width: 320px; flex-shrink: 0; background: #111827; border: 1px solid #1f2937;
          border-radius: 10px; display: flex; flex-direction: column; max-height: 78vh;
        }
        .ai-pg-sessions-head { padding: 12px; border-bottom: 1px solid #1f2937; }
        .ai-pg-sessions-head h2 { font-size: 13px; margin: 0 0 8px; color: #9ca3af; }
        .ai-pg-search {
          width: 100%; background: #0b0f17; border: 1px solid #374151; color: #e5e7eb;
          padding: 6px 10px; border-radius: 6px; font-size: 12px;
        }
        .ai-pg-sessions-list { overflow-y: auto; flex: 1; }
        .ai-pg-session-item {
          display: block; width: 100%; text-align: right; background: transparent; border: none;
          border-bottom: 1px solid #1f2937; padding: 10px 12px; cursor: pointer; color: #e5e7eb;
        }
        .ai-pg-session-item:hover { background: #1f2937; }
        .ai-pg-session-item.selected { background: #1e3a5f; border-left: 3px solid #3b82f6; }
        .ai-pg-session-top { display: flex; justify-content: space-between; align-items: center; }
        .ai-pg-session-name { font-size: 13px; font-weight: 600; }
        .ai-pg-session-count {
          font-size: 10px; background: #374151; color: #d1d5db; padding: 2px 6px; border-radius: 999px;
        }
        .ai-pg-session-last {
          font-size: 12px; color: #9ca3af; margin-top: 4px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .ai-pg-session-date { font-size: 10px; color: #6b7280; margin-top: 2px; }

        .ai-pg-main {
          flex: 1; background: #111827; border: 1px solid #1f2937; border-radius: 10px;
          padding: 16px; display: flex; flex-direction: column; max-height: 78vh;
        }
        .ai-pg-empty-main {
          color: #6b7280; text-align: center; padding: 40px; font-size: 13px; margin: auto;
        }
        .ai-pg-empty { color: #6b7280; padding: 20px; text-align: center; font-size: 12px; }

        .ai-pg-conv-head {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: 10px; border-bottom: 1px solid #1f2937; margin-bottom: 12px;
        }
        .ai-pg-conv-meta { color: #6b7280; font-size: 12px; }
        .ai-pg-regen {
          background: #1f2937; border: 1px solid #374151; color: #d1d5db; padding: 6px 12px;
          border-radius: 6px; cursor: pointer; font-size: 12px;
        }
        .ai-pg-regen:hover { background: #374151; }

        .ai-pg-conv { flex: 1; overflow-y: auto; padding-bottom: 12px; }
        .ai-pg-msg {
          margin-bottom: 10px; padding: 10px 12px; border-radius: 10px; max-width: 80%;
        }
        .ai-pg-msg.user {
          background: #1e3a5f; margin-right: auto; border: 1px solid #2563eb33;
        }
        .ai-pg-msg.admin {
          background: #064e3b; margin-left: auto; border: 1px solid #10b98133;
        }
        .ai-pg-msg-meta {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
        }
        .ai-pg-msg-sender { font-size: 11px; font-weight: 600; color: #d1d5db; }
        .ai-pg-msg-time { font-size: 10px; color: #6b7280; font-family: monospace; }
        .ai-pg-msg-text { font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
        .ai-pg-msg-text.muted { color: #6b7280; font-style: italic; }

        .ai-pg-ai-reply {
          margin-top: 12px; background: #0b0f17; border: 1px dashed #374151; border-radius: 10px; padding: 12px;
        }
        .ai-pg-ai-reply-head {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }
        .ai-pg-ai-reply-head span { font-size: 12px; font-weight: 600; color: #a78bfa; }
        .ai-pg-elapsed {
          font-size: 10px; color: #6b7280; font-family: monospace;
          background: #1f2937; padding: 2px 6px; border-radius: 4px;
        }
        .ai-pg-ai-reply-text { font-size: 14px; line-height: 1.7; white-space: pre-wrap; color: #e5e7eb; }
        .ai-pg-ai-reply-text.muted { color: #6b7280; font-style: italic; }
        .ai-pg-ai-error {
          background: rgba(239,68,68,0.1); color: #fca5a5; padding: 8px; border-radius: 6px; font-size: 12px;
        }

        .ai-pg-test-main { gap: 0; }
        .ai-pg-test-info {
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
          color: #93c5fd; padding: 10px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 12px;
        }
        .ai-pg-test-input {
          display: flex; gap: 8px; align-items: stretch; margin-top: 12px; border-top: 1px solid #1f2937; padding-top: 12px;
        }
        .ai-pg-test-input textarea {
          flex: 1; background: #0b0f17; border: 1px solid #374151; color: #e5e7eb;
          padding: 10px; border-radius: 8px; font-size: 13px; resize: none; font-family: inherit;
        }
        .ai-pg-test-input button {
          background: #3b82f6; border: none; color: #fff; padding: 0 18px; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 600;
        }
        .ai-pg-test-input button:disabled { background: #1f2937; color: #6b7280; cursor: not-allowed; }
        .ai-pg-clear {
          background: transparent !important; color: #9ca3af !important; border: 1px solid #374151 !important;
          padding: 0 12px !important;
        }

        .ai-pg-context { overflow-y: auto; }
        .ai-pg-context details {
          background: #0b0f17; border: 1px solid #1f2937; border-radius: 8px; margin-bottom: 10px;
        }
        .ai-pg-context summary {
          padding: 10px 12px; cursor: pointer; font-size: 13px; font-weight: 600; color: #d1d5db;
        }
        .ai-pg-context pre {
          padding: 12px; margin: 0; font-size: 12px; line-height: 1.6; white-space: pre-wrap;
          word-break: break-word; color: #9ca3af; font-family: monospace; border-top: 1px solid #1f2937;
        }
        .ai-pg-context-msgs { max-height: 50vh; overflow-y: auto; }
        .ai-pg-ctx-msg {
          padding: 8px 12px; border-bottom: 1px solid #1f2937;
        }
        .ai-pg-ctx-msg.system { background: rgba(167,139,250,0.05); }
        .ai-pg-ctx-msg.user { background: rgba(59,130,246,0.05); }
        .ai-pg-ctx-msg.assistant { background: rgba(16,185,129,0.05); }
        .ai-pg-ctx-role {
          font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;
          display: block; margin-bottom: 4px;
        }
        .ai-pg-ctx-msg pre {
          font-size: 11px; color: #d1d5db; padding: 0; margin: 0; border: none;
        }

        @media (max-width: 900px) {
          .ai-pg-body { flex-direction: column; }
          .ai-pg-sessions { width: 100%; max-height: 40vh; }
          .ai-pg-main { max-height: none; }
        }
      `}</style>
    </div>
  );
}
