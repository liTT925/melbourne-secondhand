"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Item = {
  id: string;
  title: string;
  price: number;
  description: string | null;
  image_url: string | null;
  wechat: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  user_id: string;
};

function formatAUD(n: number) {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `A$${n}`;
  }
}

export default function ItemPage() {
  const params = useParams();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const isOwner = useMemo(() => {
    if (!item || !currentUserId) return false;
    return item.user_id === currentUserId;
  }, [item, currentUserId]);

  useEffect(() => {
    let alive = true;

    async function loadItem() {
      // 先拿当前登录用户
      const { data: authData } = await supabase.auth.getUser();
      if (!alive) return;
      setCurrentUserId(authData?.user?.id ?? null);

      // 再拿商品
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!alive) return;

      if (!error && data) {
        setItem(data as Item);
      } else {
        setItem(null);
      }

      setLoading(false);
    }

    loadItem();

    return () => {
      alive = false;
    };
  }, [params.id]);

  async function copyText(label: string, value: string | null) {
    if (!value) {
      setToast(`${label}未填写`);
      setTimeout(() => setToast(null), 1200);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setToast(`已复制${label}`);
      setTimeout(() => setToast(null), 1200);
    } catch {
      setToast("复制失败（浏览器权限限制）");
      setTimeout(() => setToast(null), 1200);
    }
  }

  async function handleDelete() {
    if (!item) return;
    const ok = confirm("确定删除这个商品吗？删除后不可恢复。");
    if (!ok) return;

    setDeleting(true);

    const { error } = await supabase.from("items").delete().eq("id", item.id);

    setDeleting(false);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    alert("删除成功");
    router.push("/");
  }

  async function handleStartChat() {
    if (!item) return;

    setStartingChat(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStartingChat(false);
      alert("请先登录后再联系卖家");
      router.push("/login");
      return;
    }

    if (user.id === item.user_id) {
      setStartingChat(false);
      alert("这是你自己发布的商品，不需要和自己聊天");
      return;
    }

    // 先查有没有已有会话
    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("item_id", item.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", item.user_id)
      .maybeSingle();

    if (existingError) {
      setStartingChat(false);
      alert("查询聊天失败：" + existingError.message);
      return;
    }

    if (existing) {
      setStartingChat(false);
      router.push(`/chat/${existing.id}`);
      return;
    }

    // 没有就创建新会话
    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({
        item_id: item.id,
        buyer_id: user.id,
        seller_id: item.user_id,
      })
      .select("id")
      .single();

    setStartingChat(false);

    if (createError) {
      alert("创建聊天失败：" + createError.message);
      return;
    }

    router.push(`/chat/${created.id}`);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
          background:
            "radial-gradient(1000px 500px at 15% 0%, rgba(0,113,227,0.14) 0%, transparent 60%), radial-gradient(900px 480px at 90% 10%, rgba(46,204,113,0.14) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
            fontWeight: 800,
          }}
        >
          加载中...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px 16px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
          background:
            "radial-gradient(1000px 500px at 15% 0%, rgba(0,113,227,0.14) 0%, transparent 60%), radial-gradient(900px 480px at 90% 10%, rgba(46,204,113,0.14) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              height: 42,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "white",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ← 返回首页
          </button>

          <div
            style={{
              marginTop: 18,
              padding: 22,
              borderRadius: 18,
              background: "rgba(255,255,255,0.88)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>商品不存在</div>
            <div style={{ marginTop: 10, color: "rgba(15,23,42,0.65)" }}>
              可能已被删除，或链接不正确。
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 500px at 15% 0%, rgba(0,113,227,0.14) 0%, transparent 60%), radial-gradient(900px 480px at 90% 10%, rgba(46,204,113,0.14) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "28px 16px 60px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* 顶部返回 + 状态 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{
              height: 42,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "rgba(255,255,255,0.9)",
              cursor: "pointer",
              fontWeight: 900,
              boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
            }}
          >
            ← 返回首页
          </button>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(15,23,42,0.08)",
                color: "rgba(15,23,42,0.65)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              发布时间：{new Date(item.created_at).toLocaleString()}
            </div>

            {isOwner && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: "rgba(46,204,113,0.14)",
                  border: "1px solid rgba(46,204,113,0.22)",
                  color: "#1f8a4c",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                这是你发布的商品
              </div>
            )}
          </div>
        </div>

        {/* 主体 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 18,
          }}
        >
          {/* 左：大图 */}
          <div
            style={{
              borderRadius: 22,
              overflow: "hidden",
              background: "rgba(255,255,255,0.86)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                style={{
                  width: "100%",
                  height: 560,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  height: 560,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                  color: "rgba(15,23,42,0.6)",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                暂无图片
              </div>
            )}
          </div>

          {/* 右：信息卡 */}
          <div
            style={{
              borderRadius: 22,
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
              padding: 20,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.15 }}>
              {item.title}
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 30,
                fontWeight: 950,
                color: "#16a34a",
              }}
            >
              {formatAUD(item.price)}
            </div>

            {/* 描述 */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 10 }}>
                商品描述
              </div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(15,23,42,0.04)",
                  border: "1px solid rgba(15,23,42,0.06)",
                  color: "rgba(15,23,42,0.78)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.description || "暂无描述"}
              </div>
            </div>

            {/* 联系卖家 */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 10 }}>
                联系卖家
              </div>

              {!isOwner && (
                <button
                  onClick={handleStartChat}
                  disabled={startingChat}
                  style={{
                    width: "100%",
                    marginBottom: 12,
                    border: "none",
                    cursor: startingChat ? "not-allowed" : "pointer",
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
                    color: "white",
                    fontWeight: 950,
                    boxShadow: "0 14px 30px rgba(0,113,227,0.22)",
                  }}
                >
                  {startingChat ? "进入聊天中..." : "聊一聊"}
                </button>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                {/* 微信 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(15,23,42,0.08)",
                  }}
                >
                  <div style={{ lineHeight: 1.2 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(15,23,42,0.55)",
                        fontWeight: 800,
                      }}
                    >
                      微信
                    </div>
                    <div style={{ fontWeight: 950 }}>{item.wechat || "未填写"}</div>
                  </div>

                  <button
                    onClick={() => copyText("微信", item.wechat)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "rgba(0,113,227,0.12)",
                      color: "#0755a6",
                      fontWeight: 950,
                    }}
                  >
                    复制
                  </button>
                </div>

                {/* 电话 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(15,23,42,0.08)",
                  }}
                >
                  <div style={{ lineHeight: 1.2 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(15,23,42,0.55)",
                        fontWeight: 800,
                      }}
                    >
                      手机号
                    </div>
                    <div style={{ fontWeight: 950 }}>{item.phone || "未填写"}</div>
                  </div>

                  <button
                    onClick={() => copyText("手机号", item.phone)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "rgba(46,204,113,0.14)",
                      color: "#1f8a4c",
                      fontWeight: 950,
                    }}
                  >
                    复制
                  </button>
                </div>

                {/* 地点 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(15,23,42,0.08)",
                  }}
                >
                  <div style={{ lineHeight: 1.2 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(15,23,42,0.55)",
                        fontWeight: 800,
                      }}
                    >
                      取货地点
                    </div>
                    <div style={{ fontWeight: 950 }}>{item.location || "未填写"}</div>
                  </div>

                  <button
                    onClick={() => copyText("取货地点", item.location)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "rgba(15,23,42,0.08)",
                      color: "#0f172a",
                      fontWeight: 950,
                    }}
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>

            {/* 删除按钮：只有本人看到 */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "none",
                  cursor: deleting ? "not-allowed" : "pointer",
                  background: "rgba(214,48,49,0.95)",
                  color: "white",
                  fontWeight: 950,
                  boxShadow: "0 14px 30px rgba(214,48,49,0.22)",
                }}
              >
                {deleting ? "删除中..." : "删除这个商品"}
              </button>
            )}

            {!currentUserId && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 16,
                  background: "rgba(0,113,227,0.08)",
                  border: "1px solid rgba(0,113,227,0.18)",
                  color: "#0755a6",
                  fontWeight: 900,
                }}
              >
                提示：登录后你可以删除自己发布的商品，也可以和卖家聊天。
              </div>
            )}
          </div>
        </div>

        {/* 小提示 Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 24,
              transform: "translateX(-50%)",
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(15,23,42,0.9)",
              color: "white",
              fontWeight: 900,
              boxShadow: "0 18px 50px rgba(15,23,42,0.25)",
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}