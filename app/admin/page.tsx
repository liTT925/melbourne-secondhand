"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  title?: string;
  price?: number;
  created_at?: string;
};

function formatPrice(price?: number) {
  if (price === undefined || price === null) return "-";
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `A$${price}`;
  }
}

function formatTime(date?: string) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalItems = useMemo(() => items.length, [items]);

  async function loadItems() {
    if (!adminKey.trim()) {
      setMsg("Please enter admin key");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/items", {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Failed to load items");
        return;
      }

      setItems(data.items || []);
      setMsg(`Loaded ${data.items?.length || 0} items`);
    } catch {
      setMsg("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    if (!adminKey.trim()) {
      setMsg("Please enter admin key");
      return;
    }

    const ok = window.confirm("Delete this item?");
    if (!ok) return;

    setDeletingId(id);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Delete failed");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setMsg("Deleted successfully");
    } catch {
      setMsg("Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("adminKey");
    if (saved) {
      setAdminKey(saved);
    }
  }, []);

  function saveKeyAndLoad() {
    localStorage.setItem("adminKey", adminKey);
    loadItems();
  }

  function clearSavedKey() {
    localStorage.removeItem("adminKey");
    setAdminKey("");
    setItems([]);
    setMsg("Saved admin key cleared");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(900px 420px at 10% 0%, rgba(0,113,227,0.12) 0%, transparent 60%), radial-gradient(900px 420px at 100% 10%, rgba(46,204,113,0.10) 0%, transparent 58%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "28px 16px 48px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "rgba(255,255,255,0.90)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 22,
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,113,227,0.08)",
                  color: "#0b63c8",
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                Melbourne Secondhand Admin
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  lineHeight: 1.08,
                  letterSpacing: -0.4,
                }}
              >
                Admin Panel
              </h1>

              <div
                style={{
                  marginTop: 8,
                  color: "rgba(15,23,42,0.62)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  maxWidth: 660,
                }}
              >
                管理商品列表、快速删除异常内容、检查后台数据状态。
              </div>
            </div>

            <a
              href="/"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.12)",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                返回首页
              </button>
            </a>
          </div>
        </div>

        {/* Top controls + stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
          }}
        >
          {/* Key panel */}
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 12,
              }}
            >
              Admin Key
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveKeyAndLoad();
                    }
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(15,23,42,0.12)",
                    background: "#fff",
                    outline: "none",
                    minWidth: 0,
                    fontSize: 14,
                  }}
                />

                <button
                  onClick={() => setShowKey((v) => !v)}
                  style={secondaryBtn}
                >
                  {showKey ? "隐藏" : "显示"}
                </button>

                <button
                  onClick={saveKeyAndLoad}
                  disabled={loading}
                  style={{
                    ...primaryBtn,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? "Loading..." : "Load Items"}
                </button>

                <button onClick={clearSavedKey} style={secondaryBtn}>
                  清空
                </button>
              </div>

              <div
                style={{
                  color: "rgba(15,23,42,0.58)",
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                回车也可以直接加载商品。Admin key 会保存在当前浏览器本地。
              </div>

              {msg && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error")
                      ? "rgba(214,48,49,0.08)"
                      : "rgba(46,204,113,0.10)",
                    border: msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error")
                      ? "1px solid rgba(214,48,49,0.18)"
                      : "1px solid rgba(46,204,113,0.22)",
                    color: msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error")
                      ? "#b02323"
                      : "#1f8a4c",
                    fontWeight: 800,
                  }}
                >
                  {msg}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(15,23,42,0.52)",
                  fontWeight: 800,
                }}
              >
                当前商品数
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 34,
                  fontWeight: 950,
                  color: "#0f172a",
                }}
              >
                {loading ? "..." : totalItems}
              </div>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                border: "1px solid rgba(15,23,42,0.06)",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(15,23,42,0.52)",
                  fontWeight: 800,
                }}
              >
                操作提示
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.5,
                }}
              >
                删除操作会立即生效，操作前先确认商品标题和 ID。
              </div>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(15,23,42,0.52)",
                  fontWeight: 800,
                }}
              >
                Inventory
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 24,
                  fontWeight: 950,
                  color: "#0f172a",
                }}
              >
                商品列表
              </div>
            </div>

            <button
              onClick={loadItems}
              disabled={loading || !adminKey.trim()}
              style={{
                ...secondaryBtn,
                cursor: loading || !adminKey.trim() ? "not-allowed" : "pointer",
                opacity: loading || !adminKey.trim() ? 0.7 : 1,
              }}
            >
              {loading ? "刷新中..." : "刷新列表"}
            </button>
          </div>

          {items.length === 0 && !loading ? (
            <div
              style={{
                padding: 24,
                borderRadius: 18,
                background: "rgba(15,23,42,0.03)",
                border: "1px solid rgba(15,23,42,0.06)",
                color: "rgba(15,23,42,0.62)",
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              还没有加载商品，或者当前没有可显示的商品。
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 18,
                    padding: 16,
                    background: "rgba(255,255,255,0.88)",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1.3,
                        wordBreak: "break-word",
                      }}
                    >
                      {item.title || "Untitled"}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div style={metaBadge}>
                        Price: {formatPrice(item.price)}
                      </div>
                      <div style={metaBadge}>
                        Created: {formatTime(item.created_at)}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        color: "rgba(15,23,42,0.52)",
                        fontSize: 12,
                        fontWeight: 700,
                        wordBreak: "break-all",
                      }}
                    >
                      ID: {item.id}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "none",
                        cursor: deletingId === item.id ? "not-allowed" : "pointer",
                        background: "rgba(214,48,49,0.95)",
                        color: "white",
                        fontWeight: 900,
                        boxShadow: "0 12px 24px rgba(214,48,49,0.20)",
                      }}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 1.1fr 0.9fr"] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          div[style*="grid-template-columns: 1fr auto auto auto"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr auto"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  height: 44,
  padding: "0 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
  color: "white",
  fontWeight: 900,
  boxShadow: "0 14px 30px rgba(0,113,227,0.18)",
};

const secondaryBtn: React.CSSProperties = {
  height: 44,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.12)",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 800,
};

const metaBadge: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(15,23,42,0.06)",
  color: "rgba(15,23,42,0.72)",
  fontSize: 12,
  fontWeight: 800,
};