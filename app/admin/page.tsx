"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  title: string;
  price: number | null;
  description: string | null;
  created_at: string;
  user_id: string | null;
  image_url: string | null;
  wechat: string | null;
  phone: string | null;
  location: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/items");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "加载失败");
      }

      setItems(json.items || []);
    } catch (e: any) {
      setMsg(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    const ok = confirm(`确定删除商品「${title}」吗？`);
    if (!ok) return;

    setDeletingId(id);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "删除失败");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setMsg("删除成功");
    } catch (e: any) {
      setMsg(e?.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 500px at 15% 0%, rgba(0,113,227,0.14) 0%, transparent 60%), radial-gradient(900px 480px at 90% 10%, rgba(214,48,49,0.12) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "28px 16px 60px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 22,
            padding: "26px 22px",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, color: "rgba(15,23,42,0.55)", fontWeight: 800 }}>
            Hidden Admin Mode
          </div>
          <h1 style={{ margin: "10px 0 8px", fontSize: 36 }}>
            管理员控制台
          </h1>
          <div style={{ color: "rgba(15,23,42,0.68)", lineHeight: 1.7 }}>
            这里可以查看全站商品，并删除违规、重复或测试数据。
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                border: "1px solid rgba(15,23,42,0.12)",
                cursor: "pointer",
                padding: "12px 14px",
                borderRadius: 14,
                background: "white",
                color: "#0f172a",
                fontWeight: 800,
              }}
            >
              返回首页
            </button>

            <button
              onClick={loadItems}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "12px 14px",
                borderRadius: 14,
                background: "#0071e3",
                color: "white",
                fontWeight: 800,
                boxShadow: "0 14px 30px rgba(0,113,227,0.22)",
              }}
            >
              刷新列表
            </button>
          </div>
        </div>

        {msg && (
          <div
            style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
              fontWeight: 800,
            }}
          >
            {msg}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(15,23,42,0.08)",
              fontWeight: 800,
            }}
          >
            加载中...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 18,
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 16px 44px rgba(15,23,42,0.10)",
                }}
              >
                <div
                  style={{
                    height: 190,
                    background:
                      "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(214,48,49,0.10) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(15,23,42,0.55)",
                    fontWeight: 800,
                    overflow: "hidden",
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "暂无图片"
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.35 }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 12,
                        background: "rgba(46,204,113,0.14)",
                        color: "#1f8a4c",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      A${item.price ?? "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color: "rgba(15,23,42,0.68)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      minHeight: 44,
                    }}
                  >
                    {item.description || "暂无描述"}
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: "rgba(15,23,42,0.52)",
                      lineHeight: 1.7,
                    }}
                  >
                    <div>商品ID：{item.id}</div>
                    <div>发布者：{item.user_id || "空"}</div>
                    <div>微信：{item.wechat || "未填"}</div>
                    <div>电话：{item.phone || "未填"}</div>
                    <div>地点：{item.location || "未填"}</div>
                    <div>
                      发布时间：
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <a
                      href={`/item/${item.id}`}
                      target="_blank"
                      style={{ textDecoration: "none", flex: 1 }}
                    >
                      <button
                        style={{
                          width: "100%",
                          border: "1px solid rgba(15,23,42,0.12)",
                          cursor: "pointer",
                          padding: "12px 14px",
                          borderRadius: 14,
                          background: "white",
                          color: "#0f172a",
                          fontWeight: 800,
                        }}
                      >
                        查看详情
                      </button>
                    </a>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      style={{
                        flex: 1,
                        border: "none",
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "rgba(214,48,49,0.95)",
                        color: "white",
                        fontWeight: 900,
                        cursor: deletingId === item.id ? "not-allowed" : "pointer",
                        boxShadow: "0 14px 30px rgba(214,48,49,0.22)",
                      }}
                    >
                      {deletingId === item.id ? "删除中..." : "管理员删除"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 22,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  color: "rgba(15,23,42,0.65)",
                  boxShadow: "0 16px 44px rgba(15,23,42,0.08)",
                }}
              >
                当前没有商品。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}