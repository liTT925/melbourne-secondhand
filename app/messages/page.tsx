"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ConversationCard = {
  conversation: Conversation;
  item: Item | null;
  latestMessage: Message | null;
  role: "buyer" | "seller";
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

export default function MessagesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<ConversationCard[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      const aTime = a.latestMessage?.created_at || a.conversation.created_at;
      const bTime = b.latestMessage?.created_at || b.conversation.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [cards]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      setErrorText(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (!user) {
        alert("请先登录后再查看消息");
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: convs, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (convError) {
        setErrorText("加载聊天列表失败：" + convError.message);
        setLoading(false);
        return;
      }

      const conversations = (convs || []) as Conversation[];

      if (conversations.length === 0) {
        setCards([]);
        setLoading(false);
        return;
      }

      const itemIds = [...new Set(conversations.map((c) => c.item_id))];
      const conversationIds = conversations.map((c) => c.id);

      const [{ data: itemsData }, { data: messagesData, error: msgError }] =
        await Promise.all([
          supabase.from("items").select("id,title,price,image_url,location").in("id", itemIds),
          supabase
            .from("messages")
            .select("*")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false }),
        ]);

      if (!alive) return;

      if (msgError) {
        setErrorText("加载消息失败：" + msgError.message);
      }

      const items = (itemsData || []) as Item[];
      const messages = (messagesData || []) as Message[];

      const itemMap = new Map<string, Item>();
      for (const item of items) {
        itemMap.set(item.id, item);
      }

      const latestMessageMap = new Map<string, Message>();
      for (const msg of messages) {
        if (!latestMessageMap.has(msg.conversation_id)) {
          latestMessageMap.set(msg.conversation_id, msg);
        }
      }

      const builtCards: ConversationCard[] = conversations.map((conv) => ({
        conversation: conv,
        item: itemMap.get(conv.item_id) || null,
        latestMessage: latestMessageMap.get(conv.id) || null,
        role: conv.seller_id === user.id ? "seller" : "buyer",
      }));

      setCards(builtCards);
      setLoading(false);
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [router]);

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
          消息中心加载中...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 16px 60px",
        background:
          "radial-gradient(1000px 560px at 10% 0%, rgba(0,113,227,0.16) 0%, transparent 58%), radial-gradient(920px 520px at 100% 10%, rgba(46,204,113,0.14) 0%, transparent 56%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* 顶部 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(15,23,42,0.55)",
                fontWeight: 800,
              }}
            >
              Melbourne Secondhand
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 30,
                fontWeight: 950,
                lineHeight: 1.1,
              }}
            >
              我的消息
            </div>
            <div
              style={{
                marginTop: 8,
                color: "rgba(15,23,42,0.62)",
                lineHeight: 1.8,
                fontWeight: 600,
              }}
            >
              这里会显示你作为买家或卖家的所有聊天。
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: "1px solid rgba(15,23,42,0.12)",
                background: "rgba(255,255,255,0.92)",
                cursor: "pointer",
                fontWeight: 900,
                boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
              }}
            >
              ← 返回首页
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {errorText && (
          <div
            style={{
              marginBottom: 16,
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

        {/* 空状态 */}
        {sortedCards.length === 0 ? (
          <div
            style={{
              padding: 28,
              borderRadius: 24,
              background: "rgba(255,255,255,0.90)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 54, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>你还没有聊天记录</div>
            <div
              style={{
                marginTop: 10,
                color: "rgba(15,23,42,0.62)",
                lineHeight: 1.8,
                fontWeight: 600,
              }}
            >
              去看看商品，点“聊一聊”之后，聊天就会出现在这里。
            </div>

            <button
              onClick={() => router.push("/")}
              style={{
                marginTop: 18,
                height: 46,
                padding: "0 18px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
                color: "white",
                fontWeight: 950,
                boxShadow: "0 14px 30px rgba(0,113,227,0.22)",
              }}
            >
              去逛商品
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {sortedCards.map((card) => {
              const latestTime =
                card.latestMessage?.created_at || card.conversation.created_at;
              const latestText = card.latestMessage?.content || "聊天已创建，快开始说第一句话吧";
              const isSeller = card.role === "seller";

              return (
                <div
                  key={card.conversation.id}
                  onClick={() => router.push(`/chat/${card.conversation.id}`)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
                    cursor: "pointer",
                  }}
                >
                  {/* 图片 */}
                  <div
                    style={{
                      width: "100%",
                      height: 110,
                      borderRadius: 18,
                      overflow: "hidden",
                      background:
                        "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                      border: "1px solid rgba(15,23,42,0.06)",
                    }}
                  >
                    {card.item?.image_url ? (
                      <img
                        src={card.item.image_url}
                        alt={card.item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "rgba(15,23,42,0.48)",
                          fontWeight: 900,
                        }}
                      >
                        暂无图片
                      </div>
                    )}
                  </div>

                  {/* 中间内容 */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 950,
                          lineHeight: 1.2,
                        }}
                      >
                        {card.item?.title || "商品已被删除"}
                      </div>

                      <div
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: isSeller
                            ? "rgba(46,204,113,0.14)"
                            : "rgba(0,113,227,0.12)",
                          border: isSeller
                            ? "1px solid rgba(46,204,113,0.20)"
                            : "1px solid rgba(0,113,227,0.16)",
                          color: isSeller ? "#1f8a4c" : "#0755a6",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {isSeller ? "你是卖家" : "你是买家"}
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#16a34a",
                        fontSize: 18,
                        fontWeight: 950,
                        marginBottom: 8,
                      }}
                    >
                      {card.item ? formatAUD(card.item.price) : "价格未知"}
                    </div>

                    <div
                      style={{
                        color: "rgba(15,23,42,0.78)",
                        fontWeight: 700,
                        lineHeight: 1.7,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {latestText}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "rgba(15,23,42,0.5)",
                        fontWeight: 700,
                      }}
                    >
                      {card.item?.location
                        ? `地点：${card.item.location}`
                        : "未填写地点"}
                    </div>
                  </div>

                  {/* 右侧 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(15,23,42,0.5)",
                        fontWeight: 800,
                        textAlign: "right",
                        maxWidth: 140,
                      }}
                    >
                      {formatTime(latestTime)}
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
                        color: "white",
                        fontWeight: 950,
                        boxShadow: "0 14px 30px rgba(0,113,227,0.18)",
                      }}
                    >
                      进入聊天
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部提示 */}
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 16,
            background: "rgba(255,255,255,0.76)",
            border: "1px solid rgba(15,23,42,0.06)",
            color: "rgba(15,23,42,0.58)",
            fontWeight: 700,
          }}
        >
          当前登录用户：{currentUserId || "未获取到"}
        </div>
      </div>
    </div>
  );
}