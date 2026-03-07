"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Item = {
  image_url: any;
  id: string | number;
  title: string;
  price: number | string | null;
  description: string | null;
  created_at: string;
  // 你后面加图片/分类/地点，可以在这里加字段
  // image_url?: string | null;
  // category?: string | null;
  // suburb?: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatPrice(price: number | string | null) {
  if (price === null || price === undefined || price === "") return "A$-";
  return `A$${price}`;
}

function formatTime(dateString: string) {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("全部");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [logoTapMsg, setLogoTapMsg] = useState<string | null>(null);

  const categories = useMemo(
    () => ["全部", "电子产品", "家具", "自行车", "教材", "其他"],
    []
  );

  async function loadItems(opts?: { reset?: boolean }) {
    setErrMsg(null);
    setLoading(true);

    try {
      let query = supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);

      const keyword = search.trim();
      if (keyword) {
        query = query.ilike("title", `%${keyword}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setItems((data as Item[]) ?? []);
    } catch (e: any) {
      setErrMsg(e?.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }

  function handleLogoTap() {
    const next = logoTapCount + 1;
    setLogoTapCount(next);

    if (next < 7) {
      const text = `开发者模式唤醒中 ${next}/7`;
      setLogoTapMsg(text);

      setTimeout(() => {
        setLogoTapMsg((current) => (current === text ? null : current));
      }, 900);
    }

    if (next >= 7) {
      setLogoTapMsg("已进入开发者模式");
      setTimeout(() => {
        window.location.href = "/admin";
      }, 300);
      setLogoTapCount(0);
    }
  }

  useEffect(() => {
    loadItems({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    return items;
  }, [items, activeCat]);

  const latestItems = useMemo(() => {
    return filteredItems.slice(0, 4);
  }, [filteredItems]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #eef7ff 0%, transparent 60%), radial-gradient(900px 500px at 90% 10%, #f3f0ff 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
        color: "#0f172a",
      }}
    >
      {/* 顶部导航 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "saturate(180%) blur(12px)",
          background: "rgba(255,255,255,0.78)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1220,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div
            onClick={handleLogoTap}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(0,113,227,1) 0%, rgba(46,204,113,1) 100%)",
                boxShadow: "0 10px 30px rgba(0,113,227,0.18)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 60%)",
                }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 16 }}>
                墨尔本留学生二手市场
              </div>
              <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)" }}>
                更快成交 · 更少踩坑 · 更像产品
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 16,
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索 iPhone / 单车 / 桌子"
                style={{
                  width: 260,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: "#0f172a",
                }}
              />
              <button
                onClick={() => loadItems()}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#0071e3",
                  color: "white",
                  fontWeight: 800,
                  boxShadow: "0 12px 24px rgba(0,113,227,0.22)",
                }}
              >
                搜索
              </button>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCat("全部");
                  loadItems({ reset: true });
                }}
                style={{
                  border: "1px solid rgba(15,23,42,0.12)",
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "white",
                  color: "#0f172a",
                  fontWeight: 800,
                }}
              >
                重置
              </button>
            </div>

            <a href="/messages" style={{ textDecoration: "none" }}>
              <button
                style={{
                  border: "1px solid rgba(15,23,42,0.10)",
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.95)",
                  color: "#0f172a",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
                }}
              >
                我的消息
              </button>
            </a>

            <a href="/publish" style={{ textDecoration: "none" }}>
              <button
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)",
                  color: "white",
                  fontWeight: 900,
                  boxShadow: "0 14px 30px rgba(46,204,113,0.22)",
                  whiteSpace: "nowrap",
                }}
              >
                + 发布商品
              </button>
            </a>

            <button
              onClick={() => loadItems()}
              style={{
                border: "1px solid rgba(15,23,42,0.12)",
                cursor: "pointer",
                padding: "12px 14px",
                borderRadius: 14,
                background: "white",
                color: "#0f172a",
                fontWeight: 900,
                whiteSpace: "nowrap",
              }}
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* Hero 区 */}
      <div style={{ maxWidth: 1220, margin: "0 auto", padding: "34px 18px 10px" }}>
        <div
          style={{
            borderRadius: 26,
            padding: "36px 28px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.68) 100%)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 20px 60px rgba(15,23,42,0.09)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(620px 260px at 16% 0%, rgba(0,113,227,0.18) 0%, transparent 60%), radial-gradient(520px 240px at 92% 8%, rgba(46,204,113,0.18) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "rgba(15,23,42,0.65)", fontWeight: 800 }}>
                面向墨尔本留学生的二手交易桌面
              </div>

              <h1
                style={{
                  margin: "10px 0 8px",
                  fontSize: 46,
                  letterSpacing: -0.8,
                  lineHeight: 1.08,
                }}
              >
                买卖闲置，像刷 App 一样顺滑
              </h1>

              <div
                style={{
                  color: "rgba(15,23,42,0.68)",
                  fontSize: 16,
                  lineHeight: 1.7,
                  maxWidth: 680,
                }}
              >
                现在你的网站已经不只是展示页了。它已经开始具备发布、浏览、搜索、聊天和消息中心这些真正的平台骨架。下一步，你会把它磨成一个更像产品、更像品牌的站。
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                {["真实商品列表", "一键发布", "关键词搜索", "站内聊天", "消息中心"].map((t) => (
                  <div
                    key={t}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 999,
                      background: "rgba(15,23,42,0.04)",
                      border: "1px solid rgba(15,23,42,0.06)",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "rgba(15,23,42,0.78)",
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                <a href="/publish" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
                      color: "white",
                      fontWeight: 900,
                      boxShadow: "0 16px 34px rgba(0,113,227,0.22)",
                    }}
                  >
                    立即发布商品
                  </button>
                </a>

                <a href="/messages" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      border: "1px solid rgba(15,23,42,0.10)",
                      cursor: "pointer",
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.92)",
                      color: "#0f172a",
                      fontWeight: 900,
                    }}
                  >
                    打开我的消息
                  </button>
                </a>
              </div>
            </div>

            {/* 右侧数据卡 */}
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 14px 36px rgba(15,23,42,0.07)",
                }}
              >
                <div style={{ fontSize: 12, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
                  当前商品数
                </div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 950 }}>
                  {loading ? "..." : filteredItems.length}
                </div>
                <div style={{ marginTop: 8, color: "rgba(15,23,42,0.6)", lineHeight: 1.7 }}>
                  这是首页当前展示的商品数量，后面可以继续接分类、地点和价格筛选。
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 14px 36px rgba(15,23,42,0.07)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
                    搜索状态
                  </div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>
                    {search.trim() ? "搜索中" : "全部商品"}
                  </div>
                </div>

                <div
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 14px 36px rgba(15,23,42,0.07)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
                    分类状态
                  </div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>
                    {activeCat}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow: "0 14px 36px rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ fontSize: 12, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
                  当前进度
                </div>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 950 }}>
                  首页、详情、聊天、消息中心
                </div>
                <div style={{ marginTop: 8, color: "rgba(15,23,42,0.64)", lineHeight: 1.7 }}>
                  你现在已经搭出一个真正二手平台的主干，不再只是“能打开”的网页。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 快速入口 */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              title: "发布商品",
              desc: "把闲置挂上来，立刻开始曝光",
              href: "/publish",
              color: "rgba(46,204,113,0.14)",
            },
            {
              title: "我的消息",
              desc: "查看买家卖家的最新聊天",
              href: "/messages",
              color: "rgba(0,113,227,0.12)",
            },
            {
              title: "刷新商品",
              desc: "重新拉取最新的商品列表",
              action: () => loadItems(),
              color: "rgba(15,23,42,0.06)",
            },
            {
              title: "开发者模式",
              desc: "连续点击左上角 Logo 进入后台",
              color: "rgba(167,139,250,0.14)",
            },
          ].map((card) =>
            card.href ? (
              <a key={card.title} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 16px 44px rgba(15,23,42,0.07)",
                    cursor: "pointer",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: card.color,
                      marginBottom: 12,
                    }}
                  />
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{card.title}</div>
                  <div style={{ marginTop: 8, color: "rgba(15,23,42,0.62)", lineHeight: 1.7 }}>
                    {card.desc}
                  </div>
                </div>
              </a>
            ) : (
              <div
                key={card.title}
                onClick={card.action}
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.88)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 16px 44px rgba(15,23,42,0.07)",
                  cursor: card.action ? "pointer" : "default",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: card.color,
                    marginBottom: 12,
                  }}
                />
                <div style={{ fontWeight: 900, fontSize: 18 }}>{card.title}</div>
                <div style={{ marginTop: 8, color: "rgba(15,23,42,0.62)", lineHeight: 1.7 }}>
                  {card.desc}
                </div>
              </div>
            )
          )}
        </div>

        {/* 分类 */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {categories.map((c) => {
            const active = c === activeCat;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                style={{
                  cursor: "pointer",
                  border: "1px solid rgba(15,23,42,0.10)",
                  background: active ? "#0f172a" : "rgba(255,255,255,0.92)",
                  color: active ? "white" : "#0f172a",
                  padding: "10px 14px",
                  borderRadius: 999,
                  fontWeight: 900,
                  boxShadow: active ? "0 14px 30px rgba(15,23,42,0.18)" : "none",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* 状态条 */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            color: "rgba(15,23,42,0.65)",
            fontSize: 13,
          }}
        >
          <div>
            {loading ? "正在加载..." : `当前展示 ${filteredItems.length} 条商品`}
            {errMsg ? ` | 错误：${errMsg}` : ""}
          </div>
          <div>提示：分类现在还是 UI，等你加 category 字段后就能接真实筛选。</div>
        </div>

        {/* 最新商品预览条 */}
        {latestItems.length > 0 && (
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {latestItems.map((item) => (
              <Link
                key={`top-${item.id}`}
                href={`/item/${item.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    padding: 14,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 14,
                      overflow: "hidden",
                      background:
                        "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                      flexShrink: 0,
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
                    ) : null}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 15,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        color: "#16a34a",
                        fontWeight: 900,
                        fontSize: 14,
                      }}
                    >
                      {formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 商品区 */}
      <div style={{ maxWidth: 1220, margin: "0 auto", padding: "12px 18px 54px" }}>
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
            <div style={{ fontSize: 13, color: "rgba(15,23,42,0.52)", fontWeight: 800 }}>
              Product Feed
            </div>
            <div style={{ marginTop: 4, fontSize: 28, fontWeight: 950 }}>最新商品</div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.88)",
              border: "1px solid rgba(15,23,42,0.08)",
              color: "rgba(15,23,42,0.58)",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            点击卡片进入商品详情
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 18,
          }}
        >
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.94)",
                  borderRadius: 22,
                  overflow: "hidden",
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 18px 50px rgba(15,23,42,0.09)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  cursor: "pointer",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 190,
                    background:
                      "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
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

                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      padding: "7px 11px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.88)",
                      border: "1px solid rgba(15,23,42,0.06)",
                      color: "#16a34a",
                      fontWeight: 900,
                      fontSize: 13,
                      boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                    }}
                  >
                    {formatPrice(item.price)}
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontWeight: 950,
                      fontSize: 17,
                      lineHeight: 1.35,
                      minHeight: 46,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color: "rgba(15,23,42,0.66)",
                      fontSize: 14,
                      lineHeight: 1.7,
                      minHeight: 48,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description ? item.description : "（暂无描述）"}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(15,23,42,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      color: "rgba(15,23,42,0.5)",
                      fontSize: 12,
                    }}
                  >
                    <div>{formatTime(item.created_at)}</div>
                    <div style={{ fontWeight: 900, color: "#0071e3" }}>点击查看详情</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!loading && filteredItems.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 26,
                borderRadius: 22,
                background: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(15,23,42,0.08)",
                color: "rgba(15,23,42,0.68)",
                boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 950, color: "#0f172a" }}>
                没有找到商品
              </div>
              <div style={{ marginTop: 10, lineHeight: 1.8 }}>
                你可以点右上角 <b>+ 发布商品</b> 先发一条测试数据，也可以试试换一个关键词重新搜索。
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div style={{ maxWidth: 1220, margin: "0 auto", padding: "0 18px 46px" }}>
        <div
          style={{
            borderRadius: 24,
            background: "rgba(255,255,255,0.84)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 16px 44px rgba(15,23,42,0.06)",
            padding: "22px 20px",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 950 }}>让交易更顺一点</div>
            <div
              style={{
                marginTop: 10,
                color: "rgba(15,23,42,0.65)",
                lineHeight: 1.8,
              }}
            >
              你的平台现在已经有商品展示、商品详情、发布功能、站内聊天和消息中心。后面再接上分类筛选、个人主页、收藏和未读消息，它就会越来越像一个完整产品。
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignContent: "flex-start",
            }}
          >
            {["商品详情", "聊天功能", "消息中心", "开发者模式", "墨尔本留学生场景"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.04)",
                  border: "1px solid rgba(15,23,42,0.06)",
                  fontWeight: 800,
                  color: "rgba(15,23,42,0.72)",
                  fontSize: 13,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {logoTapMsg && (
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
            zIndex: 999,
          }}
        >
          {logoTapMsg}
        </div>
      )}
    </div>
  );
}