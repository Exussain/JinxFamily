"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminCacheBustHref } from "../../lib/adminUrl.mjs";

const formatTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatFullTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPriorityColor = (score) => {
  if (score >= 80) return "#ed4245";
  if (score >= 60) return "#faa61a";
  if (score >= 40) return "#5865f2";
  return "#43b581";
};

const getPriorityLabel = (score, label) => {
  if (label) return label.charAt(0).toUpperCase() + label.slice(1);
  if (score >= 80) return "Urgent";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
};

export default function DiscordAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const messagesEndRef = useRef(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load channels
  const loadChannels = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/discord/channels`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login?from=protected");
        return;
      }
      if (res.status === 403) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load channels");

      const data = await res.json();
      setChannels(data.results || []);
    } catch (err) {
      console.error("Error loading channels:", err);
      setError(err.message);
    }
  }, [apiBase, router]);

  // Load messages for selected channel
  const loadMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${apiBase}/api/discord/channels/${channelId}/messages`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load messages");

      const data = await res.json();
      setMessages(data.results || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [apiBase, scrollToBottom]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch(`${apiBase}/api/auth/me`, {
          credentials: "include",
        });
        if (meRes.status === 401) {
          router.push("/login?from=protected");
          return;
        }
        const me = await meRes.json();
        const normalizedUser = me.user || me;
        if (!normalizedUser.is_admin) {
          router.push("/panel/user");
          return;
        }
        setUser(normalizedUser);
        await loadChannels();
      } catch (err) {
        console.error("Init error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [apiBase, router, loadChannels]);

  // Auto-refresh channels every 30s
  useEffect(() => {
    const interval = setInterval(loadChannels, 30000);
    return () => clearInterval(interval);
  }, [loadChannels]);

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.channel_id);
    }
  }, [selectedChannel, loadMessages]);

  // Auto-refresh messages every 5s when a channel is selected
  useEffect(() => {
    if (!selectedChannel) return;
    const interval = setInterval(() => {
      loadMessages(selectedChannel.channel_id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChannel, loadMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel || sending) return;

    setSending(true);
    try {
      const res = await fetch(`${apiBase}/api/discord/channels/${selectedChannel.channel_id}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send message");
      }

      setNewMessage("");
      // Reload messages to show the new one
      setTimeout(() => loadMessages(selectedChannel.channel_id), 500);
    } catch (err) {
      console.error("Error sending message:", err);
      alert(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Filter channels
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch = searchQuery
      ? ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.last_message_excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesPriority =
      filterPriority === "all" ||
      (filterPriority === "urgent" && ch.priority_score >= 80) ||
      (filterPriority === "high" && ch.priority_score >= 60 && ch.priority_score < 80) ||
      (filterPriority === "medium" && ch.priority_score >= 40 && ch.priority_score < 60) ||
      (filterPriority === "low" && ch.priority_score < 40);

    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !channels.length) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => { window.location.href = adminCacheBustHref(); }} style={styles.backButton}>
          Back to Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar - Channel List */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.serverName}>Nubix Tickets</h2>
          <span style={styles.channelCount}>{channels.length} channels</span>
        </div>

        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterBox}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent (80+)</option>
            <option value="high">High (60-79)</option>
            <option value="medium">Medium (40-59)</option>
            <option value="low">Low (&lt;40)</option>
          </select>
        </div>

        <div style={styles.channelList}>
          {filteredChannels.map((channel) => (
            <div
              key={channel.channel_id}
              style={{
                ...styles.channelItem,
                ...(selectedChannel?.channel_id === channel.channel_id ? styles.channelItemActive : {}),
              }}
              onClick={() => setSelectedChannel(channel)}
            >
              <div style={styles.channelHeader}>
                <span style={styles.channelName}># {channel.name}</span>
                <span
                  style={{
                    ...styles.priorityBadge,
                    backgroundColor: getPriorityColor(channel.priority_score),
                  }}
                >
                  {channel.priority_score}
                </span>
              </div>
              <div style={styles.channelPreview}>
                {channel.last_message_excerpt?.slice(0, 60) || "No messages"}
                {channel.last_message_excerpt?.length > 60 ? "..." : ""}
              </div>
              <div style={styles.channelMeta}>
                <span style={styles.channelTime}>{formatTime(channel.last_message_at)}</span>
                {channel.needs_2fa && <span style={styles.tag2fa}>2FA</span>}
                {channel.needs_sync && <span style={styles.tagSync}>SYNC</span>}
              </div>
            </div>
          ))}

          {filteredChannels.length === 0 && (
            <div style={styles.noChannels}>No channels match your filters</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.chatArea}>
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <span style={styles.chatChannelName}># {selectedChannel.name}</span>
                <span
                  style={{
                    ...styles.priorityLabel,
                    color: getPriorityColor(selectedChannel.priority_score),
                  }}
                >
                  {getPriorityLabel(selectedChannel.priority_score, selectedChannel.priority_label)}
                </span>
              </div>
              <div style={styles.chatHeaderRight}>
                <button
                  onClick={() => loadMessages(selectedChannel.channel_id)}
                  style={styles.refreshButton}
                  title="Refresh messages"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* AI Summary */}
            {selectedChannel.last_ai_summary && (
              <div style={styles.aiSummary}>
                <strong>AI Summary:</strong> {selectedChannel.last_ai_summary}
                <span style={styles.aiTime}>
                  {selectedChannel.last_ai_at ? formatFullTime(selectedChannel.last_ai_at) : ""}
                </span>
              </div>
            )}

            {/* Messages */}
            <div style={styles.messagesContainer}>
              {loadingMessages ? (
                <div style={styles.loadingMessages}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={styles.noMessages}>No messages in this channel</div>
              ) : (
                messages.map((msg, index) => {
                  const isBot = msg.author_is_bot || msg.direction === "outbound";
                  const showAuthor =
                    index === 0 || messages[index - 1]?.author_id !== msg.author_id;

                  return (
                    <div
                      key={msg.id || index}
                      style={{
                        ...styles.messageWrapper,
                        ...(isBot ? styles.messageWrapperBot : {}),
                      }}
                    >
                      {showAuthor && (
                        <div style={styles.messageAuthorRow}>
                          <img
                            src={msg.author_avatar || "/default-avatar.png"}
                            alt=""
                            style={styles.messageAvatar}
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect fill='%235865f2' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='white' font-size='16'%3E%3F%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <span style={styles.messageAuthorName}>
                            {msg.author_name || "Unknown"}
                            {isBot && <span style={styles.botTag}>BOT</span>}
                          </span>
                          <span style={styles.messageTime}>{formatFullTime(msg.created_at)}</span>
                        </div>
                      )}
                      <div style={styles.messageContent}>
                        {msg.content}
                        {msg.delivery_status === "queued" && (
                          <span style={styles.statusQueued}> (queued)</span>
                        )}
                        {msg.delivery_status === "failed" && (
                          <span style={styles.statusFailed}> (failed)</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} style={styles.inputForm}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${selectedChannel.name}`}
                style={styles.messageInput}
                disabled={sending}
              />
              <button
                type="submit"
                style={{
                  ...styles.sendButton,
                  ...(sending || !newMessage.trim() ? styles.sendButtonDisabled : {}),
                }}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? "..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div style={styles.noChannelSelected}>
            <h2>Select a channel</h2>
            <p>Choose a ticket channel from the sidebar to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#36393f",
    color: "#dcddde",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    direction: "ltr",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#36393f",
    color: "#dcddde",
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: "4px solid #5865f2",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#36393f",
    color: "#dcddde",
    padding: 20,
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    padding: "10px 20px",
    backgroundColor: "#5865f2",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },

  // Sidebar
  sidebar: {
    width: 320,
    backgroundColor: "#2f3136",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #202225",
  },
  sidebarHeader: {
    padding: 16,
    borderBottom: "1px solid #202225",
  },
  serverName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
  },
  channelCount: {
    fontSize: 12,
    color: "#72767d",
  },
  searchBox: {
    padding: "8px 12px",
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "#202225",
    border: "none",
    borderRadius: 4,
    color: "#dcddde",
    fontSize: 14,
    outline: "none",
  },
  filterBox: {
    padding: "0 12px 8px",
  },
  filterSelect: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "#202225",
    border: "none",
    borderRadius: 4,
    color: "#dcddde",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
  },
  channelList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  channelItem: {
    padding: "10px 12px",
    marginBottom: 4,
    borderRadius: 4,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  channelItemActive: {
    backgroundColor: "#42464d",
  },
  channelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  channelName: {
    fontWeight: 500,
    color: "#fff",
    fontSize: 14,
  },
  priorityBadge: {
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 600,
  },
  channelPreview: {
    fontSize: 12,
    color: "#72767d",
    lineHeight: 1.4,
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  channelMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  channelTime: {
    fontSize: 11,
    color: "#72767d",
  },
  tag2fa: {
    fontSize: 10,
    padding: "1px 4px",
    borderRadius: 3,
    backgroundColor: "#faa61a",
    color: "#000",
    fontWeight: 600,
  },
  tagSync: {
    fontSize: 10,
    padding: "1px 4px",
    borderRadius: 3,
    backgroundColor: "#5865f2",
    color: "#fff",
    fontWeight: 600,
  },
  noChannels: {
    padding: 20,
    textAlign: "center",
    color: "#72767d",
    fontSize: 14,
  },

  // Chat Area
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#36393f",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #202225",
    backgroundColor: "#36393f",
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  chatChannelName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: 600,
  },
  chatHeaderRight: {
    display: "flex",
    gap: 8,
  },
  refreshButton: {
    padding: "6px 12px",
    backgroundColor: "#4f545c",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
  },
  aiSummary: {
    padding: "10px 16px",
    backgroundColor: "#2f3136",
    borderBottom: "1px solid #202225",
    fontSize: 13,
    color: "#b9bbbe",
    lineHeight: 1.5,
  },
  aiTime: {
    display: "block",
    marginTop: 4,
    fontSize: 11,
    color: "#72767d",
  },

  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  loadingMessages: {
    textAlign: "center",
    padding: 40,
    color: "#72767d",
  },
  noMessages: {
    textAlign: "center",
    padding: 40,
    color: "#72767d",
  },
  messageWrapper: {
    marginBottom: 4,
    paddingLeft: 52,
    position: "relative",
  },
  messageWrapperBot: {
    backgroundColor: "rgba(88, 101, 242, 0.1)",
    marginLeft: -16,
    marginRight: -16,
    paddingLeft: 68,
    paddingTop: 4,
    paddingBottom: 4,
  },
  messageAuthorRow: {
    display: "flex",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
    marginLeft: -52,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    marginRight: 12,
    backgroundColor: "#5865f2",
  },
  messageAuthorName: {
    fontWeight: 500,
    color: "#fff",
    marginRight: 8,
  },
  botTag: {
    fontSize: 10,
    padding: "2px 4px",
    borderRadius: 3,
    backgroundColor: "#5865f2",
    color: "#fff",
    marginLeft: 6,
    verticalAlign: "middle",
  },
  messageTime: {
    fontSize: 11,
    color: "#72767d",
  },
  messageContent: {
    color: "#dcddde",
    lineHeight: 1.5,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  statusQueued: {
    color: "#faa61a",
    fontSize: 12,
  },
  statusFailed: {
    color: "#ed4245",
    fontSize: 12,
  },

  // Input Form
  inputForm: {
    display: "flex",
    padding: "0 16px 16px",
    gap: 8,
  },
  messageInput: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "#40444b",
    border: "none",
    borderRadius: 8,
    color: "#dcddde",
    fontSize: 14,
    outline: "none",
  },
  sendButton: {
    padding: "12px 20px",
    backgroundColor: "#5865f2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    transition: "background-color 0.15s",
  },
  sendButtonDisabled: {
    backgroundColor: "#4f545c",
    cursor: "not-allowed",
  },

  // No Channel Selected
  noChannelSelected: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#72767d",
    textAlign: "center",
  },
};
