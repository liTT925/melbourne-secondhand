"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("全部");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const categories = useMemo(
    () => ["全部", "电子产品", "家具", "自行车", "教材", "其他"],
    []
  );

  async function loadItems(opts?: { reset?: boolean }) {
    setErrMsg(null);
    setLoading(true);

    try {
      // 先按你的现状：items 表只有 title/price/description/created_at
      // 分类暂时只做 UI（activeCat），等你表里加 category 字段后再启用筛选
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

  useEffect(() => {
    loadItems({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI 级分类过滤（不依赖数据库字段）
  const filteredItems = useMemo(() => {
    // 目前你数据库里大概率还没有 category 字段，所以先不做真实筛选
    // 等你加了 category 字段后，我再给你一行改成数据库筛选。
    return items;
  }, [items, activeCat]);

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
          backdropFilter: "saturate(180%) blur(10px)",
          background: "rgba(255,255,255,0.8)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(0,113,227,1) 0%, rgba(46,204,113,1) 100%)",
                boxShadow: "0 10px 30px rgba(0,113,227,0.18)",
              }}
            />
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>
                墨尔本留学生二手市场
              </div>
              <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)" }}>
                更快成交 · 更少踩坑 · 更像产品
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 14,
                background: "rgba(255,255,255,0.9)",
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
                  fontWeight: 700,
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
                  fontWeight: 700,
                }}
              >
                重置
              </button>
            </div>

            <a href="/publish" style={{ textDecoration: "none" }}>
              <button
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)",
                  color: "white",
                  fontWeight: 800,
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
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* Hero 区 */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 18px 10px" }}>
        <div
          style={{
            borderRadius: 22,
            padding: "34px 26px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(600px 240px at 20% 0%, rgba(0,113,227,0.18) 0%, transparent 60%), radial-gradient(520px 220px at 90% 10%, rgba(46,204,113,0.18) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 14, color: "rgba(15,23,42,0.65)", fontWeight: 700 }}>
              面向墨尔本留学生的二手交易桌面
            </div>
            <h1 style={{ margin: "10px 0 8px", fontSize: 44, letterSpacing: -0.5 }}>
              买卖闲置，像刷 App 一样顺滑
            </h1>
            <div style={{ color: "rgba(15,23,42,0.65)", fontSize: 16, lineHeight: 1.6 }}>
              现在先把“能用”做到极致：发布、浏览、搜索、刷新都可靠。下一步再加登录、图片、聊天。
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              {["真实商品列表", "一键发布", "关键词搜索", "极速刷新"].map((t) => (
                <div
                  key={t}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.04)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(15,23,42,0.75)",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
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
                  background: active ? "#0f172a" : "rgba(255,255,255,0.9)",
                  color: active ? "white" : "#0f172a",
                  padding: "10px 14px",
                  borderRadius: 999,
                  fontWeight: 800,
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
          <div>提示：目前“分类”先做 UI，等你加 category 字段后我帮你接上数据库筛选。</div>
        </div>
      </div>

      {/* 商品区 */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 18px 50px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {filteredItems.map((item) => (
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
              {/* 图片占位（后面你加 image_url 我再帮你接真实图片） */}
              <div
                style={{
                  height: 170,
                  background:
                    "linear-gradient(135deg, rgba(0,113,227,0.10) 0%, rgba(46,204,113,0.10) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(15,23,42,0.55)",
                  fontWeight: 800,
                }}
              >
                {item.image_url ? (
  <img
    src={item.image_url}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }}
  />
) : (
  "暂无图片"
)}
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.3 }}>
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

                <div style={{ marginTop: 10, color: "rgba(15,23,42,0.65)", fontSize: 14 }}>
                  {item.description ? item.description : "（暂无描述）"}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "rgba(15,23,42,0.5)",
                    fontSize: 12,
                  }}
                >
                  <div>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : ""}
                  </div>
                  <div style={{ fontWeight: 800 }}>详情页（下一步做）</div>
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredItems.length === 0 && (
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
              没有找到商品。你可以点右上角 <b>+ 发布商品</b> 先发一条测试数据。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}