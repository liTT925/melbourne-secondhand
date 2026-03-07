"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id: string;
};

type Conversation = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type Item = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  location: string | null;
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

function formatTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const otherSideLabel = useMemo(() => {
    if (!conversation || !currentUserId) return "对方";
    return currentUserId === conversation.seller_id ? "买家" : "卖家";
  }, [conversation, currentUserId]);

  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);
      setErrorText(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (!user) {
        alert("请先登录后再查看聊天");
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (!alive) return;

      if (convError || !conv) {
        setErrorText("聊天不存在，或者你没有权限查看。");
        setLoading(false);
        return;
      }

      const typedConv = conv as Conversation;

      if (typedConv.buyer_id !== user.id && typedConv.seller_id !== user.id) {
        setErrorText("你没有权限查看这个聊天。");
        setLoading(false);
        return;
      }

      setConversation(typedConv);

      const [{ data: itemData, error: itemError }, { data: msgData, error: msgError }] =
        await Promise.all([
          supabase
            .from("items")
            .select("id,title,price,image_url,location")
            .eq("id", typedConv.item_id)
            .single(),
          supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true }),
        ]);

      if (!alive) return;

      if (!itemError && itemData) {
        setItem(itemData as Item);
      }

      if (msgError) {
        setErrorText("消息加载失败：" + msgError.message);
      } else {
        setMessages((msgData || []) as Message[]);
      }

      setLoading(false);
    }

    init();

    return () => {
      alive = false;
    };
  }, [conversationId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function sendMessage() {
    if (!input.trim()) return;
    if (!currentUserId) {
      alert("请先登录");
      router.push("/login");
      return;
    }

    setSending(true);
    setErrorText(null);

    const text = input.trim();

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text,
    });

    setSending(false);

    if (error) {
      setErrorText("发送失败：" + error.message);
      return;
    }

    setInput("");
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1000px 560px at 10% 0%, rgba(0,113,227,0.16) 0%, transparent 58%), radial-gradient(920px 520px at 100% 10%, rgba(46,204,113,0.14) 0%, transparent 56%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
          color: "#0f172a",
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            background: "rgba(255,255,255,0.84)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            fontWeight: 900,
          }}
        >
          聊天加载中...
        </div>
      </div>
    );
  }

  if (errorText && !conversation) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px 16px 60px",
          background:
            "radial-gradient(1000px 560px at 10% 0%, rgba(0,113,227,0.16) 0%, transparent 58%), radial-gradient(920px 520px at 100% 10%, rgba(46,204,113,0.14) 0%, transparent 56%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              height: 42,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              fontWeight: 900,
              boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
            }}
          >
            ← 返回首页
          </button>

          <div
            style={{
              marginTop: 18,
              padding: 22,
              borderRadius: 20,
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 950 }}>无法进入聊天</div>
            <div style={{ marginTop: 10, color: "rgba(15,23,42,0.68)", lineHeight: 1.8 }}>
              {errorText}
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
        padding: "26px 16px 34px",
        background:
          "radial-gradient(1000px 560px at 10% 0%, rgba(0,113,227,0.16) 0%, transparent 58%), radial-gradient(920px 520px at 100% 10%, rgba(46,204,113,0.14) 0%, transparent 56%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "340px minmax(0, 1fr)",
          gap: 18,
        }}
      >
        {/* 左侧商品卡 */}
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid rgba(15,23,42,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "rgba(15,23,42,0.55)", fontWeight: 800 }}>
                当前聊天商品
              </div>
              <div style={{ marginTop: 4, fontWeight: 950, fontSize: 18 }}>
                {item?.title || "商品信息加载中"}
              </div>
            </div>

            <button
              onClick={() => (item ? router.push(`/items/${item.id}`) : router.push("/"))}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(0,113,227,0.10)",
                color: "#0755a6",
                fontWeight: 900,
              }}
            >
              去商品页
            </button>
          </div>

          {item?.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              style={{
                width: "100%",
                height: 230,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                height: 230,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                color: "rgba(15,23,42,0.55)",
                fontWeight: 900,
              }}
            >
              暂无图片
            </div>
          )}

          <div style={{ padding: 18 }}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(46,204,113,0.12)",
                border: "1px solid rgba(46,204,113,0.20)",
                color: "#1f8a4c",
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              {item ? formatAUD(item.price) : "价格加载中"}
            </div>

            <div style={{ color: "rgba(15,23,42,0.62)", fontSize: 14, lineHeight: 1.8 }}>
              {item?.location ? `取货地点：${item.location}` : "卖家还没有填写取货地点"}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 16,
                background: "rgba(15,23,42,0.04)",
                border: "1px solid rgba(15,23,42,0.06)",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
                正在对话
              </div>
              <div style={{ marginTop: 6, fontWeight: 900 }}>
                你正在和{otherSideLabel}沟通这件商品
              </div>
            </div>
          </div>
        </div>

        {/* 右侧聊天区 */}
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            background: "rgba(255,255,255,0.90)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            minHeight: "78vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 头部 */}
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid rgba(15,23,42,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: "rgba(255,255,255,0.84)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
                Melbourne Secondhand Chat
              </div>
              <div style={{ marginTop: 4, fontSize: 22, fontWeight: 950 }}>
                和{otherSideLabel}聊一聊
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              style={{
                border: "1px solid rgba(15,23,42,0.10)",
                cursor: "pointer",
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.92)",
                color: "#0f172a",
                fontWeight: 900,
              }}
            >
              返回首页
            </button>
          </div>

          {/* 错误提示 */}
          {errorText && (
            <div
              style={{
                margin: "14px 16px 0",
                padding: "12px 14px",
                borderRadius: 16,
                background: "rgba(214,48,49,0.08)",
                border: "1px solid rgba(214,48,49,0.18)",
                color: "#b02323",
                fontWeight: 800,
              }}
            >
              {errorText}
            </div>
          )}

          {/* 消息列表 */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 16px 10px",
              background:
                "linear-gradient(180deg, rgba(248,250,252,0.7) 0%, rgba(255,255,255,0.72) 100%)",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  minHeight: 360,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    maxWidth: 420,
                    textAlign: "center",
                    padding: 24,
                    borderRadius: 22,
                    background: "rgba(255,255,255,0.82)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 10 }}>💬</div>
                  <div style={{ fontWeight: 950, fontSize: 20 }}>聊天刚刚开始</div>
                  <div
                    style={{
                      marginTop: 10,
                      lineHeight: 1.8,
                      color: "rgba(15,23,42,0.62)",
                    }}
                  >
                    发第一条消息吧。比如问对方是否还在售、什么时候方便面交、能不能小刀一点价格。
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.sender_id === currentUserId;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "72%",
                        padding: "12px 14px",
                        borderRadius: mine
                          ? "18px 18px 6px 18px"
                          : "18px 18px 18px 6px",
                        background: mine
                          ? "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)"
                          : "rgba(255,255,255,0.98)",
                        color: mine ? "white" : "#0f172a",
                        border: mine ? "none" : "1px solid rgba(15,23,42,0.08)",
                        boxShadow: mine
                          ? "0 14px 34px rgba(0,113,227,0.20)"
                          : "0 10px 28px rgba(15,23,42,0.07)",
                        wordBreak: "break-word",
                      }}
                    >
                      <div
                        style={{
                          lineHeight: 1.75,
                          fontWeight: 700,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          opacity: mine ? 0.9 : 0.5,
                          fontWeight: 800,
                        }}
                      >
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={bottomRef} />
          </div>

          {/* 输入区 */}
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(15,23,42,0.06)",
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px",
                gap: 12,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，比如：这件还在吗？可以周末在Clayton面交吗？"
                style={{
                  width: "100%",
                  height: 54,
                  borderRadius: 16,
                  border: "1px solid rgba(15,23,42,0.10)",
                  outline: "none",
                  padding: "0 16px",
                  fontSize: 15,
                  fontWeight: 700,
                  background: "rgba(248,250,252,0.92)",
                  color: "#0f172a",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              />

              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                style={{
                  height: 54,
                  borderRadius: 16,
                  border: "none",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                  background:
                    sending || !input.trim()
                      ? "rgba(15,23,42,0.18)"
                      : "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
                  color: "white",
                  fontWeight: 950,
                  fontSize: 15,
                  boxShadow:
                    sending || !input.trim()
                      ? "none"
                      : "0 14px 30px rgba(0,113,227,0.22)",
                }}
              >
                {sending ? "发送中..." : "发送"}
              </button>
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "rgba(15,23,42,0.5)",
                fontWeight: 700,
              }}
            >
              按 Enter 可以直接发送消息
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}